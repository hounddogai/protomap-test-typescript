import * as text from "../../../../kit/text.js";

/** Where a adaptive invite adjustment is in its life cycle. */
export type AdaptiveInviteAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** One adaptive invite adjustment, with what the planners need to act on it. */
export class AdaptiveInviteAdjustment {
  code: string;
  name: string;
  openRate: number;
  currency: string;
  impressions: number;
  threshold: number;
  maximum: number;
  status: AdaptiveInviteAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    currency: string,
    impressions: number,
    threshold: number,
    maximum: number,
    status: AdaptiveInviteAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.currency = currency;
    this.impressions = impressions;
    this.threshold = threshold;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveInviteAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: AdaptiveInviteAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive invite adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.openRate * this.threshold * 100) / 100;
  }

  copy(): AdaptiveInviteAdjustment {
    return new AdaptiveInviteAdjustment(
      this.code,
      this.name,
      this.openRate,
      this.currency,
      this.impressions,
      this.threshold,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive invite adjustment in status created. */
export function newAdaptiveInviteAdjustment(code: string, name: string): AdaptiveInviteAdjustment {
  return new AdaptiveInviteAdjustment(code, name, 0, "", 0, 0, 0, "created");
}
