import { EscalationRule } from "./escalation-rule.js";

/** A rule a escalation rule must pass. Check returns its problems, or none. */
export interface EscalationRuleRule {
  check(item: EscalationRule): string[];
}

export class EscalationRuleCodePrefixRule implements EscalationRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationRuleRequiredLabelRule implements EscalationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationRule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationRuleRequiredPhoneRule implements EscalationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationRule): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationRuleLabelLengthRule implements EscalationRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationRuleScoreRangeRule implements EscalationRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationRule): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationRuleConversionRateRangeRule implements EscalationRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationRule): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a escalation rule. */
export class EscalationRuleValidator {
  rules: EscalationRuleRule[];

  constructor(rules: EscalationRuleRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationRule[]): Map<string, string[]> {
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

export function defaultEscalationRuleValidator(): EscalationRuleValidator {
  return new EscalationRuleValidator(
    [
      new EscalationRuleCodePrefixRule("X"),
      new EscalationRuleRequiredLabelRule("escalation rule needs a value"),
      new EscalationRuleRequiredPhoneRule("escalation rule needs a value"),
      new EscalationRuleLabelLengthRule(120),
      new EscalationRuleScoreRangeRule(8.7, 2983.6),
      new EscalationRuleConversionRateRangeRule(9.2, 2590.2),
    ],
  );
}
