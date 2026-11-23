"""
Unit tests for SelfHire.ai Distributed Worker Runner.
Verifies distributed row leasing, execution handlers, lease expiration, and error handling.
"""

import pytest
from datetime import datetime, timezone, timedelta
from services.worker.runner import TaskRunner


@pytest.fixture
def temp_runner(tmp_path):
    db_path = str(tmp_path / "runner_test.db")
    runner = TaskRunner(db_path=db_path, worker_id="test_worker_1")
    return runner


def test_task_runner_lifecycle(temp_runner):
    # 1. Enqueue task
    task_id = temp_runner.enqueue_task("jobs.search", {"keyword": "Distributed Systems"})
    assert task_id.startswith("tsk_")

    # 2. Acquire task lease
    task = temp_runner.acquire_next_task(lease_duration_seconds=30)
    assert task is not None
    assert task["id"] == task_id
    assert task["task_type"] == "jobs.search"
    assert task["payload"]["keyword"] == "Distributed Systems"
    assert task["attempts"] == 1

    # Attempting to acquire again immediately should return None (already leased)
    assert temp_runner.acquire_next_task() is None

    # 3. Complete task
    temp_runner.complete_task(task_id, {"status": "SUCCESS", "found": 18})

    # Verify task status in DB
    with temp_runner._get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT status, result FROM agent_tasks WHERE id = ?", (task_id,))
        row = cur.fetchone()
        assert row["status"] == "COMPLETED"
        assert "18" in row["result"]


def test_task_runner_run_once_execution(temp_runner):
    task_id = temp_runner.enqueue_task("jobs.search", {"keyword": "Backend Python"})
    result = temp_runner.run_once()

    assert result is not None
    assert result["status"] == "COMPLETED"
    assert result["result"]["jobs_scanned"] == 106
    assert result["result"]["keyword"] == "Backend Python"


def test_task_runner_expired_lease_recovery(temp_runner):
    # Enqueue task and acquire with 0-second lease (immediately expired)
    task_id = temp_runner.enqueue_task("outreach.draft", {"recruiter_id": 42})
    task1 = temp_runner.acquire_next_task(lease_duration_seconds=-10)
    assert task1 is not None

    # Another worker should be able to acquire the expired task
    runner2 = TaskRunner(db_path=temp_runner.db_path, worker_id="test_worker_2")
    task2 = runner2.acquire_next_task(lease_duration_seconds=30)
    assert task2 is not None
    assert task2["id"] == task_id
    assert task2["attempts"] == 2


def test_task_runner_failure_and_retry(temp_runner):
    def failing_handler(payload):
        raise ValueError("Network timeout connecting to ATS portal")

    temp_runner.register_handler("failing.task", failing_handler)
    task_id = temp_runner.enqueue_task("failing.task", {"url": "https://example.com"}, max_attempts=2)

    # First attempt: should fail and re-queue
    res1 = temp_runner.run_once()
    assert res1["status"] == "RETRY_OR_FAILED"

    with temp_runner._get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT status, attempts FROM agent_tasks WHERE id = ?", (task_id,))
        row = cur.fetchone()
        assert row["status"] == "QUEUED"
        assert row["attempts"] == 1

    # Second attempt: exceeds max_attempts -> FAILED
    res2 = temp_runner.run_once()
    with temp_runner._get_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT status, attempts FROM agent_tasks WHERE id = ?", (task_id,))
        row = cur.fetchone()
        assert row["status"] == "FAILED"
        assert row["attempts"] == 2
