import * as text from "../../../../kit/text.js";

/** Where a primary insight profile is in its life cycle. */
export type PrimaryInsightProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a primary insight profile and its current status. */
export class PrimaryInsightProfile {
  code: string;
  name: string;
  region: string;
  impressions: number;
  variant: string;
  frequencyCap: number;
  bid: number;
  checksum: string;
  utmSource: string;
  active: boolean;
  amount: number;
  status: PrimaryInsightProfileStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    impressions: number,
    variant: string,
    frequencyCap: number,
    bid: number,
    checksum: string,
    utmSource: string,
    active: boolean,
    amount: number,
    status: PrimaryInsightProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.impressions = impressions;
    this.variant = variant;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
    this.checksum = checksum;
    this.utmSource = utmSource;
    this.active = active;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryInsightProfileStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PrimaryInsightProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary insight profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round(this.amount * this.frequencyCap * 100) / 100;
  }

  copy(): PrimaryInsightProfile {
    return new PrimaryInsightProfile(
      this.code,
      this.name,
      this.region,
      this.impressions,
      this.variant,
      this.frequencyCap,
      this.bid,
      this.checksum,
      this.utmSource,
      this.active,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a primary insight profile in status open. */
export function newPrimaryInsightProfile(code: string, name: string): PrimaryInsightProfile {
  return new PrimaryInsightProfile(code, name, "", 0, "", 0, 0, "", "", false, 0, "open");
}
