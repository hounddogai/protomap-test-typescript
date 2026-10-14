import * as text from "../../../../kit/text.js";

/** Where a fallback reward rule agreement is in its life cycle. */
export type FallbackRewardRuleAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback reward rule agreement as the reward rule team keeps it. */
export class FallbackRewardRuleAgreement {
  code: string;
  name: string;
  conversionRate: number;
  variant: string;
  ceiling: number;
  segment: string;
  createdAt: number;
  clicks: number;
  status: FallbackRewardRuleAgreementStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    variant: string,
    ceiling: number,
    segment: string,
    createdAt: number,
    clicks: number,
    status: FallbackRewardRuleAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.variant = variant;
    this.ceiling = ceiling;
    this.segment = segment;
    this.createdAt = createdAt;
    this.clicks = clicks;
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

  canMoveTo(next: FallbackRewardRuleAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
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

  moveTo(next: FallbackRewardRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reward rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fallback reward rule agreement"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.conversionRate + this.clicks) * 100) / 100;
  }

  copy(): FallbackRewardRuleAgreement {
    return new FallbackRewardRuleAgreement(
      this.code,
      this.name,
      this.conversionRate,
      this.variant,
      this.ceiling,
      this.segment,
      this.createdAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback reward rule agreement in status idle. */
export function newFallbackRewardRuleAgreement(code: string, name: string): FallbackRewardRuleAgreement {
  return new FallbackRewardRuleAgreement(code, name, 0, "", 0, "", 0, 0, "idle");
}
