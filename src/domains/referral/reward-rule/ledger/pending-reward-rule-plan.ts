import * as text from "../../../../kit/text.js";

/** Where a pending reward rule plan is in its life cycle. */
export type PendingRewardRulePlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One pending reward rule plan, with what the planners need to act on it. */
export class PendingRewardRulePlan {
  code: string;
  label: string;
  externalRef: string;
  amount: number;
  description: string;
  summary: string;
  status: PendingRewardRulePlanStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    amount: number,
    description: string,
    summary: string,
    status: PendingRewardRulePlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.amount = amount;
    this.description = description;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingRewardRulePlanStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PendingRewardRulePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward rule plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): PendingRewardRulePlan {
    return new PendingRewardRulePlan(
      this.code,
      this.label,
      this.externalRef,
      this.amount,
      this.description,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending reward rule plan in status planned. */
export function newPendingRewardRulePlan(code: string, label: string): PendingRewardRulePlan {
  return new PendingRewardRulePlan(code, label, "", 0, "", "", "planned");
}
