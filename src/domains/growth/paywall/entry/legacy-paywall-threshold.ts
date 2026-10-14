import * as text from "../../../../kit/text.js";

/** Where a legacy paywall threshold is in its life cycle. */
export type LegacyPaywallThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy paywall threshold as the paywall team keeps it. */
export class LegacyPaywallThreshold {
  code: string;
  name: string;
  impressions: number;
  rate: number;
  capacity: number;
  endsAt: number;
  source: string;
  status: LegacyPaywallThresholdStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    rate: number,
    capacity: number,
    endsAt: number,
    source: string,
    status: LegacyPaywallThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.rate = rate;
    this.capacity = capacity;
    this.endsAt = endsAt;
    this.source = source;
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

  canMoveTo(next: LegacyPaywallThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacyPaywallThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy paywall threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round(this.impressions * this.endsAt * 100) / 100;
  }

  copy(): LegacyPaywallThreshold {
    return new LegacyPaywallThreshold(
      this.code,
      this.name,
      this.impressions,
      this.rate,
      this.capacity,
      this.endsAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy paywall threshold in status draft. */
export function newLegacyPaywallThreshold(code: string, name: string): LegacyPaywallThreshold {
  return new LegacyPaywallThreshold(code, name, 0, 0, 0, 0, "", "draft");
}
