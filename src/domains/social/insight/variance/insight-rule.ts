import * as text from "../../../../kit/text.js";

/** Where a insight rule is in its life cycle. */
export type InsightRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a insight rule and its current status. */
export class InsightRule {
  code: string;
  name: string;
  locale: string;
  priority: number;
  description: string;
  status: InsightRuleStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    priority: number,
    description: string,
    status: InsightRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.priority = priority;
    this.description = description;
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

  canMoveTo(next: InsightRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"insight rule"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): InsightRule {
    return new InsightRule(this.code, this.name, this.locale, this.priority, this.description, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a insight rule in status proposed. */
export function newInsightRule(code: string, name: string): InsightRule {
  return new InsightRule(code, name, "", 0, "", "proposed");
}
