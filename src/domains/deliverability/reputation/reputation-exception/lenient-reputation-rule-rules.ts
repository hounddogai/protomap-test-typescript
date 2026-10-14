import { LenientReputationRule } from "./lenient-reputation-rule.js";

/** A rule a lenient reputation rule must pass. Check returns its problems, or none. */
export interface LenientReputationRuleRule {
  check(item: LenientReputationRule): string[];
}

export class LenientReputationRuleCodePrefixRule implements LenientReputationRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientReputationRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientReputationRuleGraceDaysRangeRule implements LenientReputationRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientReputationRule): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientReputationRuleRequiredLabelRule implements LenientReputationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientReputationRule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientReputationRuleVariantLengthRule implements LenientReputationRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientReputationRule): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientReputationRuleCodeLengthRule implements LenientReputationRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientReputationRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientReputationRuleLabelLengthRule implements LenientReputationRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientReputationRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient reputation rule. */
export class LenientReputationRuleValidator {
  rules: LenientReputationRuleRule[];

  constructor(rules: LenientReputationRuleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientReputationRule): string[] {
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

  requireValid(item: LenientReputationRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientReputationRule[]): Map<string, string[]> {
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

export function defaultLenientReputationRuleValidator(): LenientReputationRuleValidator {
  return new LenientReputationRuleValidator(
    [
      new LenientReputationRuleCodePrefixRule("REF"),
      new LenientReputationRuleGraceDaysRangeRule(16, 255),
      new LenientReputationRuleRequiredLabelRule("lenient reputation rule needs an entry"),
      new LenientReputationRuleVariantLengthRule(1000),
      new LenientReputationRuleCodeLengthRule(80),
      new LenientReputationRuleLabelLengthRule(80),
    ],
  );
}
