import { JourneyRule } from "./journey-rule.js";

/** A rule a journey rule must pass. Check returns its problems, or none. */
export interface JourneyRuleRule {
  check(item: JourneyRule): string[];
}

export class JourneyRuleRequiredLabelRule implements JourneyRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyRuleWeightRangeRule implements JourneyRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyRule): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyRuleGraceDaysRangeRule implements JourneyRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyRule): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyRuleLabelLengthRule implements JourneyRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey rule. */
export class JourneyRuleValidator {
  rules: JourneyRuleRule[];

  constructor(rules: JourneyRuleRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyRule): string[] {
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

  requireValid(item: JourneyRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyRule[]): Map<string, string[]> {
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

export function defaultJourneyRuleValidator(): JourneyRuleValidator {
  return new JourneyRuleValidator(
    [
      new JourneyRuleRequiredLabelRule("journey rule needs a value"),
      new JourneyRuleWeightRangeRule(7.9, 4821.2),
      new JourneyRuleGraceDaysRangeRule(16, 3600),
      new JourneyRuleLabelLengthRule(255),
    ],
  );
}
