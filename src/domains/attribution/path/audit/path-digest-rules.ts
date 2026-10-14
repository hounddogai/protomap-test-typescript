import { PathDigest } from "./path-digest.js";

/** A rule a path digest must pass. Check returns its problems, or none. */
export interface PathDigestRule {
  check(item: PathDigest): string[];
}

export class PathDigestRequiredNameRule implements PathDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PathDigestRequiredCodeRule implements PathDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathDigestPhoneLengthRule implements PathDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathDigest): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathDigestRetriesRangeRule implements PathDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathDigest): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a path digest. */
export class PathDigestValidator {
  rules: PathDigestRule[];

  constructor(rules: PathDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PathDigest): string[] {
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

  requireValid(item: PathDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathDigest[]): Map<string, string[]> {
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

export function defaultPathDigestValidator(): PathDigestValidator {
  return new PathDigestValidator(
    [
      new PathDigestRequiredNameRule("path digest needs this field"),
      new PathDigestRequiredCodeRule("path digest needs this field"),
      new PathDigestPhoneLengthRule(86400),
      new PathDigestRetriesRangeRule(32, 80),
    ],
  );
}
