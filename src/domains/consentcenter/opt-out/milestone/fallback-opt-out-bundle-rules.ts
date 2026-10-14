import * as text from "../../../../kit/text.js";
import { FallbackOptOutBundle } from "./fallback-opt-out-bundle.js";

/** A rule a fallback opt out bundle must pass. Check returns its problems, or none. */
export interface FallbackOptOutBundleRule {
  check(item: FallbackOptOutBundle): string[];
}

export class FallbackOptOutBundleAllowedLabelRule implements FallbackOptOutBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackOptOutBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class FallbackOptOutBundleRequiredCodeRule implements FallbackOptOutBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackOptOutBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackOptOutBundleBudgetRangeRule implements FallbackOptOutBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackOptOutBundle): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback opt out bundle. */
export class FallbackOptOutBundleValidator {
  rules: FallbackOptOutBundleRule[];

  constructor(rules: FallbackOptOutBundleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackOptOutBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackOptOutBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackOptOutBundle[]): Map<string, string[]> {
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

export function defaultFallbackOptOutBundleValidator(): FallbackOptOutBundleValidator {
  return new FallbackOptOutBundleValidator(
    [
      new FallbackOptOutBundleAllowedLabelRule(["batched", "manual"]),
      new FallbackOptOutBundleRequiredCodeRule("fallback opt out bundle needs a value"),
      new FallbackOptOutBundleBudgetRangeRule(4.1, 2549.9),
    ],
  );
}
