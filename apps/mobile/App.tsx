import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from "react-native";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "inbox" | "analysis">("dashboard");
  const [isApproved, setIsApproved] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF5E7" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>SelfHire.ai</Text>
          <Text style={styles.brandSubtitle}>Personal AI Career Agent</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Agent Online</Text>
        </View>
      </View>

      {/* TAB NAVIGATION */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === "dashboard" && styles.navItemActive]}
          onPress={() => setActiveTab("dashboard")}
        >
          <Text style={[styles.navText, activeTab === "dashboard" && styles.navTextActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === "analysis" && styles.navItemActive]}
          onPress={() => setActiveTab("analysis")}
        >
          <Text style={[styles.navText, activeTab === "analysis" && styles.navTextActive]}>Job Match</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === "inbox" && styles.navItemActive]}
          onPress={() => setActiveTab("inbox")}
        >
          <Text style={[styles.navText, activeTab === "inbox" && styles.navTextActive]}>Approval Gate (1)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "dashboard" && (
          <View>
            <Text style={styles.sectionTitle}>Today's Career Telemetry</Text>
            
            {/* KPI GRID */}
            <View style={styles.grid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>126</Text>
                <Text style={styles.kpiLabel}>Jobs Found</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiNumber, { color: "#E67E22" }]}>34</Text>
                <Text style={styles.kpiLabel}>Strong Matches</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>12</Text>
                <Text style={styles.kpiLabel}>Prepared</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiNumber, { color: "#B34A0E" }]}>8</Text>
                <Text style={styles.kpiLabel}>Submitted</Text>
              </View>
            </View>

            {/* HIGH-PRIORITY ACTION CARD */}
            <View style={styles.actionCard}>
              <Text style={styles.actionCardTitle}>Top Opportunity</Text>
              <Text style={styles.actionCardRole}>Junior Full Stack Developer</Text>
              <Text style={styles.actionCardCompany}>Razorpay · Bengaluru (Hybrid)</Text>
              <View style={styles.matchPillRow}>
                <Text style={styles.scoreBadge}>94% ATS Match</Text>
                <Text style={styles.verifiedBadge}>✓ Verified Greenhouse</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setActiveTab("inbox")}
              >
                <Text style={styles.primaryButtonText}>Review Prepared Application</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "analysis" && (
          <View>
            <Text style={styles.sectionTitle}>Deep ATS Analysis</Text>
            <View style={styles.actionCard}>
              <Text style={styles.actionCardRole}>Junior Full Stack Developer</Text>
              <Text style={styles.actionCardCompany}>TechCorp India</Text>

              <View style={styles.scoreDialContainer}>
                <Text style={styles.largeScore}>94%</Text>
                <Text style={styles.scoreSub}>Compatibility Heuristic</Text>
              </View>

              <Text style={styles.subHeading}>Matched Skills (18)</Text>
              <View style={styles.pillsContainer}>
                {["Python", "React", "REST APIs", "SQL", "Docker", "Git"].map((s) => (
                  <View key={s} style={styles.skillPill}>
                    <Text style={styles.skillText}>{s} ✓</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.subHeading, { color: "#DC2626" }]}>Gaps (2)</Text>
              <View style={styles.pillsContainer}>
                <View style={[styles.skillPill, { backgroundColor: "#FEE2E2" }]}>
                  <Text style={[styles.skillText, { color: "#991B1B" }]}>Kubernetes</Text>
                </View>
                <View style={[styles.skillPill, { backgroundColor: "#FEE2E2" }]}>
                  <Text style={[styles.skillText, { color: "#991B1B" }]}>Azure</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === "inbox" && (
          <View>
            <Text style={styles.sectionTitle}>Exact-Action Approval Gate</Text>
            <View style={styles.actionCard}>
              <Text style={styles.hashBadge}>SHA-256: 7b9f3e...88c2</Text>
              <Text style={styles.actionCardRole}>TechCorp India — Application</Text>
              <Text style={styles.actionCardCompany}>All 9 form fields populated from Evidence Vault</Text>

              <View style={styles.reviewBox}>
                <Text style={styles.reviewItem}>• Full Name: Alex Rivera</Text>
                <Text style={styles.reviewItem}>• Email: alex.rivera@example.com</Text>
                <Text style={styles.reviewItem}>• Resume: Tailored ATS PDF (v1.2)</Text>
                <Text style={styles.reviewItem}>• Experience: 1.5 yrs verified</Text>
                <Text style={styles.reviewItem}>• Legal Attestation: Truthful Declaration</Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isApproved && { backgroundColor: "#065F46" }]}
                onPress={() => setIsApproved(true)}
              >
                <Text style={styles.primaryButtonText}>
                  {isApproved ? "✓ Application Authorized & Submitted" : "Approve & Submit (Single-Use)"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dangerButton}>
                <Text style={styles.dangerButtonText}>Reject / Emergency Kill Switch</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FEF5E7" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(110, 37, 10, 0.12)"
  },
  brandTitle: { fontSize: 20, fontWeight: "800", color: "#B34A0E" },
  brandSubtitle: { fontSize: 11, color: "#2D0E03", opacity: 0.7 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981", marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: "700", color: "#065F46" },
  navBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(110, 37, 10, 0.08)"
  },
  navItem: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginRight: 6 },
  navItemActive: { backgroundColor: "#B34A0E" },
  navText: { fontSize: 12, fontWeight: "700", color: "#2D0E03" },
  navTextActive: { color: "#FFFFFF" },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#2D0E03", marginBottom: 12 },
  grid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  kpiCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(110, 37, 10, 0.12)",
    elevation: 1
  },
  kpiNumber: { fontSize: 22, fontWeight: "800", color: "#2D0E03" },
  kpiLabel: { fontSize: 11, color: "rgba(45, 14, 3, 0.6)", marginTop: 2, fontWeight: "600" },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(110, 37, 10, 0.12)",
    marginBottom: 20
  },
  actionCardTitle: { fontSize: 11, fontWeight: "800", color: "#B34A0E", textTransform: "uppercase" },
  actionCardRole: { fontSize: 16, fontWeight: "800", color: "#2D0E03", marginTop: 2 },
  actionCardCompany: { fontSize: 13, color: "rgba(45, 14, 3, 0.7)", marginBottom: 10 },
  matchPillRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  scoreBadge: {
    backgroundColor: "#FAD7A0",
    color: "#2D0E03",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  verifiedBadge: {
    backgroundColor: "#ECFDF5",
    color: "#065F46",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  primaryButton: {
    backgroundColor: "#B34A0E",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  dangerButton: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8
  },
  dangerButtonText: { color: "#DC2626", fontWeight: "600", fontSize: 12 },
  scoreDialContainer: { alignItems: "center", marginVertical: 14 },
  largeScore: { fontSize: 36, fontWeight: "900", color: "#E67E22" },
  scoreSub: { fontSize: 11, color: "rgba(45, 14, 3, 0.6)" },
  subHeading: { fontSize: 13, fontWeight: "700", color: "#2D0E03", marginTop: 10, marginBottom: 6 },
  pillsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  skillPill: {
    backgroundColor: "#FAD7A0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  skillText: { fontSize: 11, fontWeight: "700", color: "#2D0E03" },
  hashBadge: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#B34A0E",
    backgroundColor: "rgba(179, 74, 14, 0.08)",
    padding: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6
  },
  reviewBox: {
    backgroundColor: "#FEF5E7",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10
  },
  reviewItem: { fontSize: 12, color: "#2D0E03", marginBottom: 3, fontWeight: "500" }
});
