import * as text from "../../../../kit/text.js";

/** Where a lenient post tier is in its life cycle. */
export type LenientPostTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a lenient post tier and its current status. */
export class LenientPostTier {
  code: string;
  label: string;
  impressions: number;
  clicks: number;
  channel: string;
  conversionRate: number;
  notes: string;
  batchSize: number;
  reviewer: string;
  attempts: number;
  country: string;
  status: LenientPostTierStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    clicks: number,
    channel: string,
    conversionRate: number,
    notes: string,
    batchSize: number,
    reviewer: string,
    attempts: number,
    country: string,
    status: LenientPostTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.clicks = clicks;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.notes = notes;
    this.batchSize = batchSize;
    this.reviewer = reviewer;
    this.attempts = attempts;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPostTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LenientPostTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient post tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netVolume(): number {
    return Math.round((this.impressions + this.attempts) * 100) / 100;
  }

  copy(): LenientPostTier {
    return new LenientPostTier(
      this.code,
      this.label,
      this.impressions,
      this.clicks,
      this.channel,
      this.conversionRate,
      this.notes,
      this.batchSize,
      this.reviewer,
      this.attempts,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient post tier in status draft. */
export function newLenientPostTier(code: string, label: string): LenientPostTier {
  return new LenientPostTier(code, label, 0, 0, "", 0, "", 0, "", 0, "", "draft");
}
