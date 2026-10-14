import * as text from "../../../../kit/text.js";

/** Where a reward rule is in its life cycle. */
export type RewardRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a reward rule and its current status. */
export class RewardRule {
  code: string;
  name: string;
  unit: string;
  weight: number;
  version: number;
  status: RewardRuleStatus;

  constructor(code: string, name: string, unit: string, weight: number, version: number, status: RewardRuleStatus) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.weight = weight;
    this.version = version;
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

  canMoveTo(next: RewardRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RewardRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.weight + this.version) * 100) / 100;
  }

  copy(): RewardRule {
    return new RewardRule(this.code, this.name, this.unit, this.weight, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a reward rule in status planned. */
export function newRewardRule(code: string, name: string): RewardRule {
  return new RewardRule(code, name, "", 0, 0, "planned");
}
