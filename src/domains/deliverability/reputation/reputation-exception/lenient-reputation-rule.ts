import * as text from "../../../../kit/text.js";

/** Where a lenient reputation rule is in its life cycle. */
export type LenientReputationRuleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One lenient reputation rule, with what the planners need to act on it. */
export class LenientReputationRule {
  code: string;
  label: string;
  graceDays: number;
  variant: string;
  title: string;
  status: LenientReputationRuleStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    variant: string,
    title: string,
    status: LenientReputationRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.variant = variant;
    this.title = title;
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

  canMoveTo(next: LenientReputationRuleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientReputationRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reputation rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): LenientReputationRule {
    return new LenientReputationRule(this.code, this.label, this.graceDays, this.variant, this.title, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient reputation rule in status draft. */
export function newLenientReputationRule(code: string, label: string): LenientReputationRule {
  return new LenientReputationRule(code, label, 0, "", "", "draft");
}
