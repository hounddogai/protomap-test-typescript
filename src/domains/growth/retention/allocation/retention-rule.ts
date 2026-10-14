import * as text from "../../../../kit/text.js";

/** Where a retention rule is in its life cycle. */
export type RetentionRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One retention rule, with what the planners need to act on it. */
export class RetentionRule {
  code: string;
  name: string;
  limit: number;
  ratio: number;
  updatedAt: number;
  budget: number;
  status: RetentionRuleStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    ratio: number,
    updatedAt: number,
    budget: number,
    status: RetentionRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.budget = budget;
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

  canMoveTo(next: RetentionRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round(this.budget * this.updatedAt * 100) / 100;
  }

  copy(): RetentionRule {
    return new RetentionRule(this.code, this.name, this.limit, this.ratio, this.updatedAt, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention rule in status planned. */
export function newRetentionRule(code: string, name: string): RetentionRule {
  return new RetentionRule(code, name, 0, 0, 0, 0, "planned");
}
