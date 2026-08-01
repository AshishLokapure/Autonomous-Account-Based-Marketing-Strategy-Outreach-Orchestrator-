import { FeaturePage } from "@/components/common/feature-page";

export default function ProductsPage() {
  return (
    <FeaturePage
      active="Products & ICP"
      eyebrow="PRODUCT INTELLIGENCE"
      title="Products & ICP"
      description="Define your products and ideal customer profiles to power AI-driven account targeting and personalized outreach."
      metric="4 ICPs"
      metricLabel="Active Profiles"
      items={[
        { title: "Enterprise SaaS ICP", detail: "500+ employees, SaaS, Series B+, cloud-first infrastructure", tag: "High fit" },
        { title: "Mid-Market ICP", detail: "100–500 employees, scaling ops, evaluating automation tools", tag: "Medium fit" },
        { title: "Platform Product", detail: "AI-powered ABM orchestration with multi-agent research", tag: "Core" },
        { title: "Add-on: Outreach Studio", detail: "Personalized email, LinkedIn, and call script generation", tag: "Upsell" },
      ]}
    />
  );
}
