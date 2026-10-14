import * as text from "../../../../kit/text.js";

/** Where a scheduled fraud check rule is in its life cycle. */
export type ScheduledFraudCheckRuleStatus = "created" | "validated" | "published" | "retired";

/** A scheduled fraud check rule. Its code is unique within a tenant. */
export class ScheduledFraudCheckRule {
  code: string;
  name: string;
  audienceId: string;
  weight: number;
  impressions: number;
  currency: string;
  amount: number;
  status: ScheduledFraudCheckRuleStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    weight: number,
    impressions: number,
    currency: string,
    amount: number,
    status: ScheduledFraudCheckRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.weight = weight;
    this.impressions = impressions;
    this.currency = currency;
    this.amount = amount;
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

  canMoveTo(next: ScheduledFraudCheckRuleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFraudCheckRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled fraud check rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled fraud check rule"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.amount + this.impressions) * 100) / 100;
  }

  copy(): ScheduledFraudCheckRule {
    return new ScheduledFraudCheckRule(
      this.code,
      this.name,
      this.audienceId,
      this.weight,
      this.impressions,
      this.currency,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled fraud check rule in status created. */
export function newScheduledFraudCheckRule(code: string, name: string): ScheduledFraudCheckRule {
  return new ScheduledFraudCheckRule(code, name, "", 0, 0, "", 0, "created");
}
