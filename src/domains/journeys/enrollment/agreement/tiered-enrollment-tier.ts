import * as text from "../../../../kit/text.js";

/** Where a tiered enrollment tier is in its life cycle. */
export type TieredEnrollmentTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered enrollment tier and its current status. */
export class TieredEnrollmentTier {
  code: string;
  label: string;
  startsAt: number;
  impressions: number;
  summary: string;
  budget: number;
  score: number;
  openRate: number;
  quantity: number;
  source: string;
  durationMinutes: number;
  status: TieredEnrollmentTierStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    impressions: number,
    summary: string,
    budget: number,
    score: number,
    openRate: number,
    quantity: number,
    source: string,
    durationMinutes: number,
    status: TieredEnrollmentTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.summary = summary;
    this.budget = budget;
    this.score = score;
    this.openRate = openRate;
    this.quantity = quantity;
    this.source = source;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: TieredEnrollmentTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TieredEnrollmentTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered enrollment tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.budget + this.score) * 100) / 100;
  }

  copy(): TieredEnrollmentTier {
    return new TieredEnrollmentTier(
      this.code,
      this.label,
      this.startsAt,
      this.impressions,
      this.summary,
      this.budget,
      this.score,
      this.openRate,
      this.quantity,
      this.source,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered enrollment tier in status proposed. */
export function newTieredEnrollmentTier(code: string, label: string): TieredEnrollmentTier {
  return new TieredEnrollmentTier(code, label, 0, 0, "", 0, 0, 0, 0, "", 0, "proposed");
}
