import * as text from "../../../../kit/text.js";

/** Where a legacy frequency target is in its life cycle. */
export type LegacyFrequencyTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a legacy frequency target and its current status. */
export class LegacyFrequencyTarget {
  code: string;
  name: string;
  discount: number;
  source: string;
  audienceId: string;
  timezone: string;
  impressions: number;
  openRate: number;
  endsAt: number;
  status: LegacyFrequencyTargetStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    source: string,
    audienceId: string,
    timezone: string,
    impressions: number,
    openRate: number,
    endsAt: number,
    status: LegacyFrequencyTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.source = source;
    this.audienceId = audienceId;
    this.timezone = timezone;
    this.impressions = impressions;
    this.openRate = openRate;
    this.endsAt = endsAt;
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

  canMoveTo(next: LegacyFrequencyTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
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

  moveTo(next: LegacyFrequencyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy frequency target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round((this.openRate + this.impressions) * 100) / 100;
  }

  copy(): LegacyFrequencyTarget {
    return new LegacyFrequencyTarget(
      this.code,
      this.name,
      this.discount,
      this.source,
      this.audienceId,
      this.timezone,
      this.impressions,
      this.openRate,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy frequency target in status proposed. */
export function newLegacyFrequencyTarget(code: string, name: string): LegacyFrequencyTarget {
  return new LegacyFrequencyTarget(code, name, 0, "", "", "", 0, 0, 0, "proposed");
}
