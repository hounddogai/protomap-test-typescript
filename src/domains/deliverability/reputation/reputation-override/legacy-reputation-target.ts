import * as text from "../../../../kit/text.js";

/** Where a legacy reputation target is in its life cycle. */
export type LegacyReputationTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy reputation target and its current status. */
export class LegacyReputationTarget {
  code: string;
  title: string;
  campaignRef: string;
  conversionRate: number;
  sendAt: number;
  maximum: number;
  segment: string;
  floorValue: number;
  country: string;
  rate: number;
  status: LegacyReputationTargetStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    conversionRate: number,
    sendAt: number,
    maximum: number,
    segment: string,
    floorValue: number,
    country: string,
    rate: number,
    status: LegacyReputationTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
    this.maximum = maximum;
    this.segment = segment;
    this.floorValue = floorValue;
    this.country = country;
    this.rate = rate;
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

  canMoveTo(next: LegacyReputationTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyReputationTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reputation target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy reputation target"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.conversionRate - this.floorValue) * 100) / 100;
  }

  copy(): LegacyReputationTarget {
    return new LegacyReputationTarget(
      this.code,
      this.title,
      this.campaignRef,
      this.conversionRate,
      this.sendAt,
      this.maximum,
      this.segment,
      this.floorValue,
      this.country,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy reputation target in status requested. */
export function newLegacyReputationTarget(code: string, title: string): LegacyReputationTarget {
  return new LegacyReputationTarget(code, title, "", 0, 0, 0, "", 0, "", 0, "requested");
}
