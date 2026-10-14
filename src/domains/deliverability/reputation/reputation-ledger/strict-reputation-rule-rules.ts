import { StrictReputationRule } from "./strict-reputation-rule.js";

/** A rule a strict reputation rule must pass. Check returns its problems, or none. */
export interface StrictReputationRuleRule {
  check(item: StrictReputationRule): string[];
}

export class StrictReputationRuleFrequencyCapRangeRule implements StrictReputationRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReputationRule): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictReputationRuleRequiredJourneyIdRule implements StrictReputationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReputationRule): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReputationRuleRequiredCodeRule implements StrictReputationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReputationRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReputationRuleLabelLengthRule implements StrictReputationRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReputationRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict reputation rule. */
export class StrictReputationRuleValidator {
  rules: StrictReputationRuleRule[];

  constructor(rules: StrictReputationRuleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictReputationRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictReputationRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictReputationRule[]): Map<string, string[]> {
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

export function defaultStrictReputationRuleValidator(): StrictReputationRuleValidator {
  return new StrictReputationRuleValidator(
    [
      new StrictReputationRuleFrequencyCapRangeRule(16, 1000),
      new StrictReputationRuleRequiredJourneyIdRule("strict reputation rule needs an entry"),
      new StrictReputationRuleRequiredCodeRule("strict reputation rule needs a value"),
      new StrictReputationRuleLabelLengthRule(16),
    ],
  );
}
