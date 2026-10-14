import * as text from "../../../../kit/text.js";

/** Where a weighted proof draft is in its life cycle. */
export type WeightedProofDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a weighted proof draft and its current status. */
export class WeightedProofDraft {
  code: string;
  label: string;
  clicks: number;
  version: number;
  category: string;
  impressions: number;
  threshold: number;
  status: WeightedProofDraftStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    version: number,
    category: string,
    impressions: number,
    threshold: number,
    status: WeightedProofDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.version = version;
    this.category = category;
    this.impressions = impressions;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedProofDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedProofDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted proof draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"weighted proof draft"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.impressions + this.clicks) * 100) / 100;
  }

  copy(): WeightedProofDraft {
    return new WeightedProofDraft(
      this.code,
      this.label,
      this.clicks,
      this.version,
      this.category,
      this.impressions,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted proof draft in status proposed. */
export function newWeightedProofDraft(code: string, label: string): WeightedProofDraft {
  return new WeightedProofDraft(code, label, 0, 0, "", 0, 0, "proposed");
}
