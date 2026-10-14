import * as text from "../../../../kit/text.js";

/** Where a reward rule cycle is in its life cycle. */
export type RewardRuleCycleStatus = "created" | "validated" | "published" | "retired";

/** The record of a reward rule cycle and its current status. */
export class RewardRuleCycle {
  code: string;
  label: string;
  priority: number;
  maximum: number;
  segment: string;
  locale: string;
  status: RewardRuleCycleStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    maximum: number,
    segment: string,
    locale: string,
    status: RewardRuleCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.maximum = maximum;
    this.segment = segment;
    this.locale = locale;
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

  canMoveTo(next: RewardRuleCycleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RewardRuleCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reward rule cycle"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.priority + this.maximum) * 100) / 100;
  }

  copy(): RewardRuleCycle {
    return new RewardRuleCycle(
      this.code,
      this.label,
      this.priority,
      this.maximum,
      this.segment,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a reward rule cycle in status created. */
export function newRewardRuleCycle(code: string, label: string): RewardRuleCycle {
  return new RewardRuleCycle(code, label, 0, 0, "", "", "created");
}
