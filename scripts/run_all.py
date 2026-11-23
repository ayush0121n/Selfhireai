"""
SelfHire.ai Unified Python Cross-Platform Orchestrator.
Allows launching the API server, background worker, and test suite via a single CLI.
Usage:
    python scripts/run_all.py --all
    python scripts/run_all.py --api
    python scripts/run_all.py --worker
    python scripts/run_all.py --test
    python scripts/run_all.py --seed
"""

import argparse
import subprocess
import sys
import os
import time


def print_banner():
    print("=" * 79)
    print("            SelfHire.ai — Autonomous Career OS Launcher")
    print("        Maison Salome Serif | Warm Espresso & Terracotta Theme")
    print("=" * 79)
    print()


def run_seed():
    print("[SelfHire.ai] Seeding database tables...")
    from scripts.seed_database import seed_database
    counts = seed_database()
    print(f"[Done] Seeded {counts['job_sources']} portals, {counts['contacts']} recruiters, {counts['profiles']} profile.")


def run_tests():
    print("[SelfHire.ai] Executing automated verification suite...")
    res = subprocess.run([sys.executable, "-m", "pytest", "tests/", "-v"])
    sys.exit(res.returncode)


def run_api(port=8000):
    print(f"[SelfHire.ai] Starting FastAPI server on http://127.0.0.1:{port}...")
    import uvicorn
    uvicorn.run("services.api.main:app", host="127.0.0.1", port=port, reload=True)


def run_worker():
    print("[SelfHire.ai] Starting Distributed Task Worker...")
    from services.worker.runner import TaskRunner
    runner = TaskRunner()
    print("[Worker Active] Listening for jobs.search, application.prepare, outreach.draft...")
    try:
        while True:
            res = runner.run_once()
            if res:
                print(f"[{time.strftime('%X')}] Processed task: {res}")
            time.sleep(2)
    except KeyboardInterrupt:
        print("[Worker Stopped]")


def main():
    parser = argparse.ArgumentParser(description="SelfHire.ai Platform Runner")
    parser.add_argument("--all", action="store_true", help="Seed database and launch API server")
    parser.add_argument("--api", action="store_true", help="Launch FastAPI server")
    parser.add_argument("--worker", action="store_true", help="Launch background task worker")
    parser.add_argument("--test", action="store_true", help="Run automated pytest suite")
    parser.add_argument("--seed", action="store_true", help="Seed SQLite/Supabase database")
    parser.add_argument("--port", type=int, default=8000, help="API server port")

    args = parser.parse_args()
    print_banner()

    if args.seed:
        run_seed()
    elif args.test:
        run_tests()
    elif args.worker:
        run_worker()
    elif args.api:
        run_api(port=args.port)
    elif args.all:
        run_seed()
        run_api(port=args.port)
    else:
        # Default behavior: seed if missing, then start API
        run_seed()
        run_api(port=args.port)


if __name__ == "__main__":
    main()
