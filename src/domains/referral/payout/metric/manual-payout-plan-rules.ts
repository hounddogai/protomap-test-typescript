import * as text from "../../../../kit/text.js";
import { ManualPayoutPlan } from "./manual-payout-plan.js";

/** A rule a manual payout plan must pass. Check returns its problems, or none. */
export interface ManualPayoutPlanRule {
  check(item: ManualPayoutPlan): string[];
}

export class ManualPayoutPlanAllowedCountryRule implements ManualPayoutPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPayoutPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is duplicated`];
    return [];
  }
}

export class ManualPayoutPlanRequiredNameRule implements ManualPayoutPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPayoutPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPayoutPlanCodePrefixRule implements ManualPayoutPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualPayoutPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualPayoutPlanPriorityRangeRule implements ManualPayoutPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPayoutPlan): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual payout plan. */
export class ManualPayoutPlanValidator {
  rules: ManualPayoutPlanRule[];

  constructor(rules: ManualPayoutPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPayoutPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: ManualPayoutPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPayoutPlan[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultManualPayoutPlanValidator(): ManualPayoutPlanValidator {
  return new ManualPayoutPlanValidator(
    [
      new ManualPayoutPlanAllowedCountryRule(["scheduled", "rolling"]),
      new ManualPayoutPlanRequiredNameRule("manual payout plan needs a value"),
      new ManualPayoutPlanCodePrefixRule("ACM"),
      new ManualPayoutPlanPriorityRangeRule(16, 86400),
    ],
  );
}
