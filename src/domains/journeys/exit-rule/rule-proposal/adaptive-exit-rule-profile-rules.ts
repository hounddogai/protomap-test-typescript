import { AdaptiveExitRuleProfile } from "./adaptive-exit-rule-profile.js";

/** A rule a adaptive exit rule profile must pass. Check returns its problems, or none. */
export interface AdaptiveExitRuleProfileRule {
  check(item: AdaptiveExitRuleProfile): string[];
}

export class AdaptiveExitRuleProfileAmountRangeRule implements AdaptiveExitRuleProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveExitRuleProfile): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveExitRuleProfileVisibleGuardRule implements AdaptiveExitRuleProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveExitRuleProfile): string[] {
    if (item.visible && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class AdaptiveExitRuleProfileRequiredLabelRule implements AdaptiveExitRuleProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveExitRuleProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive exit rule profile. */
export class AdaptiveExitRuleProfileValidator {
  rules: AdaptiveExitRuleProfileRule[];

  constructor(rules: AdaptiveExitRuleProfileRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveExitRuleProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveExitRuleProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveExitRuleProfile[]): Map<string, string[]> {
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

export function defaultAdaptiveExitRuleProfileValidator(): AdaptiveExitRuleProfileValidator {
  return new AdaptiveExitRuleProfileValidator(
    [
      new AdaptiveExitRuleProfileAmountRangeRule(5.1, 478.4),
      new AdaptiveExitRuleProfileVisibleGuardRule(80),
      new AdaptiveExitRuleProfileRequiredLabelRule("adaptive exit rule profile needs a value"),
    ],
  );
}
