import * as text from "../../../../kit/text.js";
import { AdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

/** A rule a adaptive cohort estimate must pass. Check returns its problems, or none. */
export interface AdaptiveCohortEstimateRule {
  check(item: AdaptiveCohortEstimate): string[];
}

export class AdaptiveCohortEstimateAllowedCodeRule implements AdaptiveCohortEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveCohortEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class AdaptiveCohortEstimateRequiredTimezoneRule implements AdaptiveCohortEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCohortEstimate): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCohortEstimateNameLengthRule implements AdaptiveCohortEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCohortEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive cohort estimate. */
export class AdaptiveCohortEstimateValidator {
  rules: AdaptiveCohortEstimateRule[];

  constructor(rules: AdaptiveCohortEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCohortEstimate): string[] {
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

  requireValid(item: AdaptiveCohortEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCohortEstimate[]): Map<string, string[]> {
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

export function defaultAdaptiveCohortEstimateValidator(): AdaptiveCohortEstimateValidator {
  return new AdaptiveCohortEstimateValidator(
    [
      new AdaptiveCohortEstimateAllowedCodeRule(["tiered"]),
      new AdaptiveCohortEstimateRequiredTimezoneRule("adaptive cohort estimate needs this field"),
      new AdaptiveCohortEstimateNameLengthRule(3600),
    ],
  );
}
