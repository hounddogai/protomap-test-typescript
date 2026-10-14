import { RollingCsatRule } from "./rolling-csat-rule.js";

/** A rule a rolling csat rule must pass. Check returns its problems, or none. */
export interface RollingCsatRuleRule {
  check(item: RollingCsatRule): string[];
}

export class RollingCsatRuleNameLengthRule implements RollingCsatRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCsatRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCsatRuleCodePrefixRule implements RollingCsatRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingCsatRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingCsatRuleCostRangeRule implements RollingCsatRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCsatRule): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingCsatRuleOpenRateRangeRule implements RollingCsatRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCsatRule): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingCsatRuleRequiredCodeRule implements RollingCsatRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCsatRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCsatRuleUnitLengthRule implements RollingCsatRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCsatRule): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling csat rule. */
export class RollingCsatRuleValidator {
  rules: RollingCsatRuleRule[];

  constructor(rules: RollingCsatRuleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCsatRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingCsatRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCsatRule[]): Map<string, string[]> {
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

export function defaultRollingCsatRuleValidator(): RollingCsatRuleValidator {
  return new RollingCsatRuleValidator(
    [
      new RollingCsatRuleNameLengthRule(64),
      new RollingCsatRuleCodePrefixRule("OPS"),
      new RollingCsatRuleCostRangeRule(5.7, 4458.7),
      new RollingCsatRuleOpenRateRangeRule(6.8, 4232.9),
      new RollingCsatRuleRequiredCodeRule("rolling csat rule needs an entry"),
      new RollingCsatRuleUnitLengthRule(16),
    ],
  );
}
