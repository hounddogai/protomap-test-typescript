import { PaywallTemplate } from "./paywall-template.js";

/** A rule a paywall template must pass. Check returns its problems, or none. */
export interface PaywallTemplateRule {
  check(item: PaywallTemplate): string[];
}

export class PaywallTemplateCodePrefixRule implements PaywallTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallTemplateRequiredCodeRule implements PaywallTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallTemplateLabelLengthRule implements PaywallTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallTemplateRequiredReviewerRule implements PaywallTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallTemplate): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallTemplateCodeLengthRule implements PaywallTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallTemplateBudgetRangeRule implements PaywallTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallTemplate): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a paywall template. */
export class PaywallTemplateValidator {
  rules: PaywallTemplateRule[];

  constructor(rules: PaywallTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallTemplate): string[] {
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

  requireValid(item: PaywallTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallTemplate[]): Map<string, string[]> {
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

export function defaultPaywallTemplateValidator(): PaywallTemplateValidator {
  return new PaywallTemplateValidator(
    [
      new PaywallTemplateCodePrefixRule("OPS"),
      new PaywallTemplateRequiredCodeRule("paywall template needs an entry"),
      new PaywallTemplateLabelLengthRule(32),
      new PaywallTemplateRequiredReviewerRule("paywall template needs this field"),
      new PaywallTemplateCodeLengthRule(64),
      new PaywallTemplateBudgetRangeRule(3.9, 194.7),
    ],
  );
}
