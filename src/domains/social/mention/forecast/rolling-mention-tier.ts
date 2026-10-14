import * as text from "../../../../kit/text.js";

/** Where a rolling mention tier is in its life cycle. */
export type RollingMentionTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling mention tier. Its code is unique within a tenant. */
export class RollingMentionTier {
  code: string;
  label: string;
  discount: number;
  journeyId: string;
  windowDays: number;
  conversionRate: number;
  status: RollingMentionTierStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    journeyId: string,
    windowDays: number,
    conversionRate: number,
    status: RollingMentionTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.journeyId = journeyId;
    this.windowDays = windowDays;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: RollingMentionTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingMentionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling mention tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.windowDays + this.discount) * 100) / 100;
  }

  copy(): RollingMentionTier {
    return new RollingMentionTier(
      this.code,
      this.label,
      this.discount,
      this.journeyId,
      this.windowDays,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling mention tier in status proposed. */
export function newRollingMentionTier(code: string, label: string): RollingMentionTier {
  return new RollingMentionTier(code, label, 0, "", 0, 0, "proposed");
}
