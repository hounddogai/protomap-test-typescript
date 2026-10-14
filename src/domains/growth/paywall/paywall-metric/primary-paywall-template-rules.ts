import { PrimaryPaywallTemplate } from "./primary-paywall-template.js";

/** A rule a primary paywall template must pass. Check returns its problems, or none. */
export interface PrimaryPaywallTemplateRule {
  check(item: PrimaryPaywallTemplate): string[];
}

export class PrimaryPaywallTemplateRequiredNameRule implements PrimaryPaywallTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPaywallTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPaywallTemplateRequiredCodeRule implements PrimaryPaywallTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPaywallTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPaywallTemplateNameLengthRule implements PrimaryPaywallTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPaywallTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary paywall template. */
export class PrimaryPaywallTemplateValidator {
  rules: PrimaryPaywallTemplateRule[];

  constructor(rules: PrimaryPaywallTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPaywallTemplate): string[] {
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

  requireValid(item: PrimaryPaywallTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPaywallTemplate[]): Map<string, string[]> {
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

export function defaultPrimaryPaywallTemplateValidator(): PrimaryPaywallTemplateValidator {
  return new PrimaryPaywallTemplateValidator(
    [
      new PrimaryPaywallTemplateRequiredNameRule("primary paywall template needs an entry"),
      new PrimaryPaywallTemplateRequiredCodeRule("primary paywall template needs an entry"),
      new PrimaryPaywallTemplateNameLengthRule(3600),
    ],
  );
}
