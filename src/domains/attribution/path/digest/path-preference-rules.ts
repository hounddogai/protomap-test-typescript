import * as text from "../../../../kit/text.js";
import { PathPreference } from "./path-preference.js";

/** A rule a path preference must pass. Check returns its problems, or none. */
export interface PathPreferenceRule {
  check(item: PathPreference): string[];
}

export class PathPreferenceExpiresAtRangeRule implements PathPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathPreference): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathPreferenceAllowedSourceRule implements PathPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is inconsistent`];
    return [];
  }
}

export class PathPreferenceTitleLengthRule implements PathPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathPreference): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathPreferenceChecksumLengthRule implements PathPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathPreference): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathPreferenceRequiredCodeRule implements PathPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathPreferenceRequiredTitleRule implements PathPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path preference. */
export class PathPreferenceValidator {
  rules: PathPreferenceRule[];

  constructor(rules: PathPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PathPreference): string[] {
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

  requireValid(item: PathPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathPreference[]): Map<string, string[]> {
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

export function defaultPathPreferenceValidator(): PathPreferenceValidator {
  return new PathPreferenceValidator(
    [
      new PathPreferenceExpiresAtRangeRule(32, 255),
      new PathPreferenceAllowedSourceRule(["scheduled", "tiered", "global"]),
      new PathPreferenceTitleLengthRule(86400),
      new PathPreferenceChecksumLengthRule(120),
      new PathPreferenceRequiredCodeRule("path preference needs an entry"),
      new PathPreferenceRequiredTitleRule("path preference needs an entry"),
    ],
  );
}
