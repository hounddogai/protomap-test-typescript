import * as text from "../../../../kit/text.js";

/** Where a bounce group is in its life cycle. */
export type BounceGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a bounce group and its current status. */
export class BounceGroup {
  code: string;
  label: string;
  timezone: string;
  impressions: number;
  limit: number;
  country: string;
  conversionRate: number;
  weight: number;
  campaignRef: string;
  channel: string;
  status: BounceGroupStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    impressions: number,
    limit: number,
    country: string,
    conversionRate: number,
    weight: number,
    campaignRef: string,
    channel: string,
    status: BounceGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.impressions = impressions;
    this.limit = limit;
    this.country = country;
    this.conversionRate = conversionRate;
    this.weight = weight;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BounceGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.conversionRate - this.weight) * 100) / 100;
  }

  copy(): BounceGroup {
    return new BounceGroup(
      this.code,
      this.label,
      this.timezone,
      this.impressions,
      this.limit,
      this.country,
      this.conversionRate,
      this.weight,
      this.campaignRef,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a bounce group in status requested. */
export function newBounceGroup(code: string, label: string): BounceGroup {
  return new BounceGroup(code, label, "", 0, 0, "", 0, 0, "", "", "requested");
}
