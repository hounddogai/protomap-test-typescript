import * as text from "../../../../kit/text.js";
import { PendingBounceScore } from "./pending-bounce-score.js";

/** A rule a pending bounce score must pass. Check returns its problems, or none. */
export interface PendingBounceScoreRule {
  check(item: PendingBounceScore): string[];
}

export class PendingBounceScoreMarginRangeRule implements PendingBounceScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBounceScore): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingBounceScoreUnitLengthRule implements PendingBounceScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBounceScore): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBounceScoreRequiredCodeRule implements PendingBounceScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBounceScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBounceScoreCodeLengthRule implements PendingBounceScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBounceScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBounceScoreAllowedCodeRule implements PendingBounceScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingBounceScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a pending bounce score. */
export class PendingBounceScoreValidator {
  rules: PendingBounceScoreRule[];

  constructor(rules: PendingBounceScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBounceScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingBounceScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBounceScore[]): Map<string, string[]> {
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

export function defaultPendingBounceScoreValidator(): PendingBounceScoreValidator {
  return new PendingBounceScoreValidator(
    [
      new PendingBounceScoreMarginRangeRule(5.8, 1934.3),
      new PendingBounceScoreUnitLengthRule(255),
      new PendingBounceScoreRequiredCodeRule("pending bounce score needs an entry"),
      new PendingBounceScoreCodeLengthRule(255),
      new PendingBounceScoreAllowedCodeRule([]),
    ],
  );
}
