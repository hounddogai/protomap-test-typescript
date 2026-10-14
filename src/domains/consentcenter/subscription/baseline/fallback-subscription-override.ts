import * as text from "../../../../kit/text.js";

/** Where a fallback subscription override is in its life cycle. */
export type FallbackSubscriptionOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback subscription override. Its code is unique within a tenant. */
export class FallbackSubscriptionOverride {
  code: string;
  title: string;
  impressions: number;
  openRate: number;
  budget: number;
  checksum: string;
  region: string;
  status: FallbackSubscriptionOverrideStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    openRate: number,
    budget: number,
    checksum: string,
    region: string,
    status: FallbackSubscriptionOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.openRate = openRate;
    this.budget = budget;
    this.checksum = checksum;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackSubscriptionOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackSubscriptionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback subscription override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback subscription override"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.openRate + this.budget) * 100) / 100;
  }

  copy(): FallbackSubscriptionOverride {
    return new FallbackSubscriptionOverride(
      this.code,
      this.title,
      this.impressions,
      this.openRate,
      this.budget,
      this.checksum,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a fallback subscription override in status idle. */
export function newFallbackSubscriptionOverride(code: string, title: string): FallbackSubscriptionOverride {
  return new FallbackSubscriptionOverride(code, title, 0, 0, 0, "", "", "idle");
}
