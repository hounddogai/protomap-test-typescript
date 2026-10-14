import * as text from "../../../../kit/text.js";
import { ScheduledPathEstimate } from "./scheduled-path-estimate.js";

/** A rule a scheduled path estimate must pass. Check returns its problems, or none. */
export interface ScheduledPathEstimateRule {
  check(item: ScheduledPathEstimate): string[];
}

export class ScheduledPathEstimateRequiredCodeRule implements ScheduledPathEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPathEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPathEstimateRequiredSegmentRule implements ScheduledPathEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPathEstimate): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPathEstimateRequiredLabelRule implements ScheduledPathEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPathEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPathEstimateAllowedCodeRule implements ScheduledPathEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPathEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class ScheduledPathEstimateTitleLengthRule implements ScheduledPathEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPathEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled path estimate. */
export class ScheduledPathEstimateValidator {
  rules: ScheduledPathEstimateRule[];

  constructor(rules: ScheduledPathEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPathEstimate): string[] {
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

  requireValid(item: ScheduledPathEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPathEstimate[]): Map<string, string[]> {
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

export function defaultScheduledPathEstimateValidator(): ScheduledPathEstimateValidator {
  return new ScheduledPathEstimateValidator(
    [
      new ScheduledPathEstimateRequiredCodeRule("scheduled path estimate needs an entry"),
      new ScheduledPathEstimateRequiredSegmentRule("scheduled path estimate needs this field"),
      new ScheduledPathEstimateRequiredLabelRule("scheduled path estimate needs an entry"),
      new ScheduledPathEstimateAllowedCodeRule(["default", "scheduled"]),
      new ScheduledPathEstimateTitleLengthRule(80),
    ],
  );
}
