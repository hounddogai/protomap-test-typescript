import * as text from "../../../../kit/text.js";
import { StrictFraudCheckTemplate } from "./strict-fraud-check-template.js";

/** A rule a strict fraud check template must pass. Check returns its problems, or none. */
export interface StrictFraudCheckTemplateRule {
  check(item: StrictFraudCheckTemplate): string[];
}

export class StrictFraudCheckTemplateRegionLengthRule implements StrictFraudCheckTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFraudCheckTemplate): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictFraudCheckTemplateCodePrefixRule implements StrictFraudCheckTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictFraudCheckTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictFraudCheckTemplateJourneyIdLengthRule implements StrictFraudCheckTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFraudCheckTemplate): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictFraudCheckTemplateAllowedCodeRule implements StrictFraudCheckTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictFraudCheckTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class StrictFraudCheckTemplateRequiredTitleRule implements StrictFraudCheckTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictFraudCheckTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictFraudCheckTemplateRequiredRegionRule implements StrictFraudCheckTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictFraudCheckTemplate): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict fraud check template. */
export class StrictFraudCheckTemplateValidator {
  rules: StrictFraudCheckTemplateRule[];

  constructor(rules: StrictFraudCheckTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: StrictFraudCheckTemplate): string[] {
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

  requireValid(item: StrictFraudCheckTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictFraudCheckTemplate[]): Map<string, string[]> {
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

export function defaultStrictFraudCheckTemplateValidator(): StrictFraudCheckTemplateValidator {
  return new StrictFraudCheckTemplateValidator(
    [
      new StrictFraudCheckTemplateRegionLengthRule(120),
      new StrictFraudCheckTemplateCodePrefixRule("ACM"),
      new StrictFraudCheckTemplateJourneyIdLengthRule(86400),
      new StrictFraudCheckTemplateAllowedCodeRule(["global", "strict", "legacy"]),
      new StrictFraudCheckTemplateRequiredTitleRule("strict fraud check template needs an entry"),
      new StrictFraudCheckTemplateRequiredRegionRule("strict fraud check template needs an entry"),
    ],
  );
}
