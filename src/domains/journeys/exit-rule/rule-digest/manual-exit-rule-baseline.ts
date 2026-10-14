import * as text from "../../../../kit/text.js";

/** Where a manual exit rule baseline is in its life cycle. */
export type ManualExitRuleBaselineStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One manual exit rule baseline, with what the planners need to act on it. */
export class ManualExitRuleBaseline {
  code: string;
  name: string;
  discount: number;
  budget: number;
  locale: string;
  tags: string[];
  status: ManualExitRuleBaselineStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    budget: number,
    locale: string,
    tags: string[],
    status: ManualExitRuleBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.budget = budget;
    this.locale = locale;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualExitRuleBaselineStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualExitRuleBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual exit rule baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round((this.discount + this.budget) * 100) / 100;
  }

  copy(): ManualExitRuleBaseline {
    return new ManualExitRuleBaseline(
      this.code,
      this.name,
      this.discount,
      this.budget,
      this.locale,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual exit rule baseline in status draft. */
export function newManualExitRuleBaseline(code: string, name: string): ManualExitRuleBaseline {
  return new ManualExitRuleBaseline(code, name, 0, 0, "", [], "draft");
}
