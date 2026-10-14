import * as text from "../../../../kit/text.js";
import { SuppressionEstimate } from "./suppression-estimate.js";

/** A rule a suppression estimate must pass. Check returns its problems, or none. */
export interface SuppressionEstimateRule {
  check(item: SuppressionEstimate): string[];
}

export class SuppressionEstimateRequiredDescriptionRule implements SuppressionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionEstimate): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionEstimateNameLengthRule implements SuppressionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionEstimateCodePrefixRule implements SuppressionEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SuppressionEstimateAllowedCodeRule implements SuppressionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a suppression estimate. */
export class SuppressionEstimateValidator {
  rules: SuppressionEstimateRule[];

  constructor(rules: SuppressionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionEstimate[]): Map<string, string[]> {
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

export function defaultSuppressionEstimateValidator(): SuppressionEstimateValidator {
  return new SuppressionEstimateValidator(
    [
      new SuppressionEstimateRequiredDescriptionRule("suppression estimate needs this field"),
      new SuppressionEstimateNameLengthRule(1000),
      new SuppressionEstimateCodePrefixRule("Q"),
      new SuppressionEstimateAllowedCodeRule(["tiered", "weighted", "global"]),
    ],
  );
}
