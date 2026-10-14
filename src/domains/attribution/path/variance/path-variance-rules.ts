import * as text from "../../../../kit/text.js";
import { PathVariance } from "./path-variance.js";

/** A rule a path variance must pass. Check returns its problems, or none. */
export interface PathVarianceRule {
  check(item: PathVariance): string[];
}

export class PathVarianceBatchSizeRangeRule implements PathVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathVariance): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathVarianceAllowedNotesRule implements PathVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is too long`];
    return [];
  }
}

export class PathVarianceCodeLengthRule implements PathVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathVarianceAttemptsRangeRule implements PathVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathVariance): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathVarianceVisibleGuardRule implements PathVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PathVariance): string[] {
    if (item.visible && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PathVarianceRequiredNotesRule implements PathVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathVariance): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path variance. */
export class PathVarianceValidator {
  rules: PathVarianceRule[];

  constructor(rules: PathVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PathVariance): string[] {
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

  requireValid(item: PathVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathVariance[]): Map<string, string[]> {
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

export function defaultPathVarianceValidator(): PathVarianceValidator {
  return new PathVarianceValidator(
    [
      new PathVarianceBatchSizeRangeRule(80, 86400),
      new PathVarianceAllowedNotesRule(["rolling", "legacy", "global"]),
      new PathVarianceCodeLengthRule(1000),
      new PathVarianceAttemptsRangeRule(120, 255),
      new PathVarianceVisibleGuardRule(16),
      new PathVarianceRequiredNotesRule("path variance needs a value"),
    ],
  );
}
