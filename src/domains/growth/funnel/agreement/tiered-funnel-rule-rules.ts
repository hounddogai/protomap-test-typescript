import { TieredFunnelRule } from "./tiered-funnel-rule.js";

/** A rule a tiered funnel rule must pass. Check returns its problems, or none. */
export interface TieredFunnelRuleRule {
  check(item: TieredFunnelRule): string[];
}

export class TieredFunnelRuleRequiredTimezoneRule implements TieredFunnelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFunnelRule): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFunnelRuleWeightRangeRule implements TieredFunnelRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFunnelRule): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredFunnelRuleTimezoneLengthRule implements TieredFunnelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFunnelRule): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFunnelRuleRequiredCodeRule implements TieredFunnelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFunnelRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFunnelRuleCodeLengthRule implements TieredFunnelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFunnelRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFunnelRuleTitleLengthRule implements TieredFunnelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFunnelRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered funnel rule. */
export class TieredFunnelRuleValidator {
  rules: TieredFunnelRuleRule[];

  constructor(rules: TieredFunnelRuleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFunnelRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredFunnelRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFunnelRule[]): Map<string, string[]> {
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

export function defaultTieredFunnelRuleValidator(): TieredFunnelRuleValidator {
  return new TieredFunnelRuleValidator(
    [
      new TieredFunnelRuleRequiredTimezoneRule("tiered funnel rule needs a value"),
      new TieredFunnelRuleWeightRangeRule(6, 258.6),
      new TieredFunnelRuleTimezoneLengthRule(120),
      new TieredFunnelRuleRequiredCodeRule("tiered funnel rule needs a value"),
      new TieredFunnelRuleCodeLengthRule(3600),
      new TieredFunnelRuleTitleLengthRule(255),
    ],
  );
}
