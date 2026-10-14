import * as text from "../../../../kit/text.js";
import { CappedWaitWindow } from "./capped-wait-window.js";

/** A rule a capped wait window must pass. Check returns its problems, or none. */
export interface CappedWaitWindowRule {
  check(item: CappedWaitWindow): string[];
}

export class CappedWaitWindowReviewerLengthRule implements CappedWaitWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWaitWindow): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedWaitWindowAllowedUnitRule implements CappedWaitWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedWaitWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is stale`];
    return [];
  }
}

export class CappedWaitWindowRequiredReviewerRule implements CappedWaitWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedWaitWindow): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class CappedWaitWindowMaximumRangeRule implements CappedWaitWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWaitWindow): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped wait window. */
export class CappedWaitWindowValidator {
  rules: CappedWaitWindowRule[];

  constructor(rules: CappedWaitWindowRule[]) {
    this.rules = rules;
  }

  validate(item: CappedWaitWindow): string[] {
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

  requireValid(item: CappedWaitWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedWaitWindow[]): Map<string, string[]> {
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

export function defaultCappedWaitWindowValidator(): CappedWaitWindowValidator {
  return new CappedWaitWindowValidator(
    [
      new CappedWaitWindowReviewerLengthRule(32),
      new CappedWaitWindowAllowedUnitRule(["primary", "pending", "adaptive"]),
      new CappedWaitWindowRequiredReviewerRule("capped wait window needs a value"),
      new CappedWaitWindowMaximumRangeRule(5, 1348.5),
    ],
  );
}
