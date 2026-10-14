import { ManualDeflectionRule } from "./manual-deflection-rule.js";

/** A rule a manual deflection rule must pass. Check returns its problems, or none. */
export interface ManualDeflectionRuleRule {
  check(item: ManualDeflectionRule): string[];
}

export class ManualDeflectionRuleMaximumRangeRule implements ManualDeflectionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualDeflectionRule): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualDeflectionRuleCodeLengthRule implements ManualDeflectionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualDeflectionRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualDeflectionRuleThresholdRangeRule implements ManualDeflectionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualDeflectionRule): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualDeflectionRuleContactEmailLengthRule implements ManualDeflectionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualDeflectionRule): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualDeflectionRuleTitleLengthRule implements ManualDeflectionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualDeflectionRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual deflection rule. */
export class ManualDeflectionRuleValidator {
  rules: ManualDeflectionRuleRule[];

  constructor(rules: ManualDeflectionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ManualDeflectionRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualDeflectionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualDeflectionRule[]): Map<string, string[]> {
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

export function defaultManualDeflectionRuleValidator(): ManualDeflectionRuleValidator {
  return new ManualDeflectionRuleValidator(
    [
      new ManualDeflectionRuleMaximumRangeRule(7.9, 2728.2),
      new ManualDeflectionRuleCodeLengthRule(64),
      new ManualDeflectionRuleThresholdRangeRule(3.1, 3666.6),
      new ManualDeflectionRuleContactEmailLengthRule(3600),
      new ManualDeflectionRuleTitleLengthRule(80),
    ],
  );
}
