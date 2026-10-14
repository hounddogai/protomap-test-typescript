import * as text from "../../../../kit/text.js";

/** Where a rolling proof tier is in its life cycle. */
export type RollingProofTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling proof tier and its current status. */
export class RollingProofTier {
  code: string;
  title: string;
  campaignRef: string;
  impressions: number;
  rate: number;
  status: RollingProofTierStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    impressions: number,
    rate: number,
    status: RollingProofTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
    this.rate = rate;
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

  canMoveTo(next: RollingProofTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingProofTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling proof tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling proof tier"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.impressions + this.rate) * 100) / 100;
  }

  copy(): RollingProofTier {
    return new RollingProofTier(this.code, this.title, this.campaignRef, this.impressions, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling proof tier in status proposed. */
export function newRollingProofTier(code: string, title: string): RollingProofTier {
  return new RollingProofTier(code, title, "", 0, 0, "proposed");
}
