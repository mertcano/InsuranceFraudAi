import type { ClaimInput } from "./ml/schema";

export interface PresetClaim {
  id: string;
  label: string;
  blurb: string;
  claim: ClaimInput;
}

/** Hand-crafted example claims spanning the risk spectrum, for the demo UI. */
export const PRESETS: PresetClaim[] = [
  {
    id: "clean",
    label: "Routine claim",
    blurb: "Established policy, daytime fender-bender, promptly reported.",
    claim: {
      policyAgeDays: 640,
      claimAmount: 8200,
      incidentHour: 15,
      daysToReport: 1,
      expertReportScore: 22,
      priorClaims12m: 0,
      witnessPresent: "Yes",
      policeReportFiled: "Yes",
      channel: "Agent",
    },
  },
  {
    id: "borderline",
    label: "Borderline case",
    blurb: "Mid-size claim with a couple of soft signals — needs a human look.",
    claim: {
      policyAgeDays: 130,
      claimAmount: 28000,
      incidentHour: 21,
      daysToReport: 6,
      expertReportScore: 52,
      priorClaims12m: 1,
      witnessPresent: "No",
      policeReportFiled: "Yes",
      channel: "Online",
    },
  },
  {
    id: "suspicious",
    label: "Textbook fraud pattern",
    blurb:
      "Brand-new policy, large night-time claim, late report, no witness or police report.",
    claim: {
      policyAgeDays: 4,
      claimAmount: 74000,
      incidentHour: 3,
      daysToReport: 21,
      expertReportScore: 83,
      priorClaims12m: 3,
      witnessPresent: "No",
      policeReportFiled: "No",
      channel: "Online",
    },
  },
];
