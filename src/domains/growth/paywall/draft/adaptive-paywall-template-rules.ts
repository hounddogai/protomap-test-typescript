import { AdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

/** A rule a adaptive paywall template must pass. Check returns its problems, or none. */
export interface AdaptivePaywallTemplateRule {
  check(item: AdaptivePaywallTemplate): string[];
}

export class AdaptivePaywallTemplateSendAtRangeRule implements AdaptivePaywallTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePaywallTemplate): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptivePaywallTemplateCodePrefixRule implements AdaptivePaywallTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptivePaywallTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptivePaywallTemplateRequiredNameRule implements AdaptivePaywallTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePaywallTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePaywallTemplateLocaleLengthRule implements AdaptivePaywallTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePaywallTemplate): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePaywallTemplateCodeLengthRule implements AdaptivePaywallTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePaywallTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePaywallTemplateRequiredLocaleRule implements AdaptivePaywallTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePaywallTemplate): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive paywall template. */
export class AdaptivePaywallTemplateValidator {
  rules: AdaptivePaywallTemplateRule[];

  constructor(rules: AdaptivePaywallTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePaywallTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePaywallTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePaywallTemplate[]): Map<string, string[]> {
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

export function defaultAdaptivePaywallTemplateValidator(): AdaptivePaywallTemplateValidator {
  return new AdaptivePaywallTemplateValidator(
    [
      new AdaptivePaywallTemplateSendAtRangeRule(255, 1000),
      new AdaptivePaywallTemplateCodePrefixRule("Q"),
      new AdaptivePaywallTemplateRequiredNameRule("adaptive paywall template needs an entry"),
      new AdaptivePaywallTemplateLocaleLengthRule(86400),
      new AdaptivePaywallTemplateCodeLengthRule(16),
      new AdaptivePaywallTemplateRequiredLocaleRule("adaptive paywall template needs a value"),
    ],
  );
}
