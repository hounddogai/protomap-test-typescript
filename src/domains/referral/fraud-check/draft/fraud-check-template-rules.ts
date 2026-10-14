import * as text from "../../../../kit/text.js";
import { FraudCheckTemplate } from "./fraud-check-template.js";

/** A rule a fraud check template must pass. Check returns its problems, or none. */
export interface FraudCheckTemplateRule {
  check(item: FraudCheckTemplate): string[];
}

export class FraudCheckTemplateAllowedLabelRule implements FraudCheckTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class FraudCheckTemplateRequiredCodeRule implements FraudCheckTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckTemplateLabelLengthRule implements FraudCheckTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check template. */
export class FraudCheckTemplateValidator {
  rules: FraudCheckTemplateRule[];

  constructor(rules: FraudCheckTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckTemplate): string[] {
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

  requireValid(item: FraudCheckTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckTemplate[]): Map<string, string[]> {
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

export function defaultFraudCheckTemplateValidator(): FraudCheckTemplateValidator {
  return new FraudCheckTemplateValidator(
    [
      new FraudCheckTemplateAllowedLabelRule(["pending", "seasonal"]),
      new FraudCheckTemplateRequiredCodeRule("fraud check template needs a value"),
      new FraudCheckTemplateLabelLengthRule(86400),
    ],
  );
}
