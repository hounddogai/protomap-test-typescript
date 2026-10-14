import * as text from "../../../../kit/text.js";

/** Where a legacy redemption digest is in its life cycle. */
export type LegacyRedemptionDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a legacy redemption digest and its current status. */
export class LegacyRedemptionDigest {
  code: string;
  label: string;
  impressions: number;
  openRate: number;
  attempts: number;
  discount: number;
  timezone: string;
  status: LegacyRedemptionDigestStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    openRate: number,
    attempts: number,
    discount: number,
    timezone: string,
    status: LegacyRedemptionDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.openRate = openRate;
    this.attempts = attempts;
    this.discount = discount;
    this.timezone = timezone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyRedemptionDigestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyRedemptionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy redemption digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.discount + this.impressions) * 100) / 100;
  }

  copy(): LegacyRedemptionDigest {
    return new LegacyRedemptionDigest(
      this.code,
      this.label,
      this.impressions,
      this.openRate,
      this.attempts,
      this.discount,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy redemption digest in status new. */
export function newLegacyRedemptionDigest(code: string, label: string): LegacyRedemptionDigest {
  return new LegacyRedemptionDigest(code, label, 0, 0, 0, 0, "", "new");
}
