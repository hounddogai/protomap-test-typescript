import * as text from "../../../../kit/text.js";

/** Where a reputation rule is in its life cycle. */
export type ReputationRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A reputation rule. Its code is unique within a tenant. */
export class ReputationRule {
  code: string;
  name: string;
  checksum: string;
  windowDays: number;
  impressions: number;
  minimum: number;
  ceiling: number;
  discount: number;
  openRate: number;
  conversionRate: number;
  status: ReputationRuleStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    windowDays: number,
    impressions: number,
    minimum: number,
    ceiling: number,
    discount: number,
    openRate: number,
    conversionRate: number,
    status: ReputationRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.windowDays = windowDays;
    this.impressions = impressions;
    this.minimum = minimum;
    this.ceiling = ceiling;
    this.discount = discount;
    this.openRate = openRate;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: ReputationRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reputation rule"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.discount * this.openRate * 100) / 100;
  }

  copy(): ReputationRule {
    return new ReputationRule(
      this.code,
      this.name,
      this.checksum,
      this.windowDays,
      this.impressions,
      this.minimum,
      this.ceiling,
      this.discount,
      this.openRate,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reputation rule in status idle. */
export function newReputationRule(code: string, name: string): ReputationRule {
  return new ReputationRule(code, name, "", 0, 0, 0, 0, 0, 0, 0, "idle");
}
