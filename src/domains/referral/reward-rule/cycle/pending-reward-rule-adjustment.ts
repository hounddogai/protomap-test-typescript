import * as text from "../../../../kit/text.js";

/** Where a pending reward rule adjustment is in its life cycle. */
export type PendingRewardRuleAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a pending reward rule adjustment and its current status. */
export class PendingRewardRuleAdjustment {
  code: string;
  label: string;
  weight: number;
  ratio: number;
  priority: number;
  source: string;
  conversionRate: number;
  variant: string;
  status: PendingRewardRuleAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    ratio: number,
    priority: number,
    source: string,
    conversionRate: number,
    variant: string,
    status: PendingRewardRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.ratio = ratio;
    this.priority = priority;
    this.source = source;
    this.conversionRate = conversionRate;
    this.variant = variant;
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

  canMoveTo(next: PendingRewardRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingRewardRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.priority + this.conversionRate) * 100) / 100;
  }

  copy(): PendingRewardRuleAdjustment {
    return new PendingRewardRuleAdjustment(
      this.code,
      this.label,
      this.weight,
      this.ratio,
      this.priority,
      this.source,
      this.conversionRate,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pending reward rule adjustment in status open. */
export function newPendingRewardRuleAdjustment(code: string, label: string): PendingRewardRuleAdjustment {
  return new PendingRewardRuleAdjustment(code, label, 0, 0, 0, "", 0, "", "open");
}
