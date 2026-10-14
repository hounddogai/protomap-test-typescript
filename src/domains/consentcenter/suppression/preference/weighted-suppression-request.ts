import * as text from "../../../../kit/text.js";

/** Where a weighted suppression request is in its life cycle. */
export type WeightedSuppressionRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted suppression request as the suppression team keeps it. */
export class WeightedSuppressionRequest {
  code: string;
  label: string;
  impressions: number;
  source: string;
  title: string;
  openRate: number;
  status: WeightedSuppressionRequestStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    source: string,
    title: string,
    openRate: number,
    status: WeightedSuppressionRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.source = source;
    this.title = title;
    this.openRate = openRate;
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

  canMoveTo(next: WeightedSuppressionRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedSuppressionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted suppression request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted suppression request"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.impressions * this.openRate * 100) / 100;
  }

  copy(): WeightedSuppressionRequest {
    return new WeightedSuppressionRequest(
      this.code,
      this.label,
      this.impressions,
      this.source,
      this.title,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted suppression request in status proposed. */
export function newWeightedSuppressionRequest(code: string, label: string): WeightedSuppressionRequest {
  return new WeightedSuppressionRequest(code, label, 0, "", "", 0, "proposed");
}
