import * as text from "../../../../kit/text.js";
import { RollingRetentionScore } from "./rolling-retention-score.js";

/** A rule a rolling retention score must pass. Check returns its problems, or none. */
export interface RollingRetentionScoreRule {
  check(item: RollingRetentionScore): string[];
}

export class RollingRetentionScoreWindowDaysRangeRule implements RollingRetentionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingRetentionScore): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingRetentionScoreCodeLengthRule implements RollingRetentionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRetentionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingRetentionScoreCodePrefixRule implements RollingRetentionScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingRetentionScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingRetentionScoreNameLengthRule implements RollingRetentionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRetentionScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingRetentionScoreAllowedLabelRule implements RollingRetentionScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingRetentionScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class RollingRetentionScoreRequiredCodeRule implements RollingRetentionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRetentionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling retention score. */
export class RollingRetentionScoreValidator {
  rules: RollingRetentionScoreRule[];

  constructor(rules: RollingRetentionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RollingRetentionScore): string[] {
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

  requireValid(item: RollingRetentionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingRetentionScore[]): Map<string, string[]> {
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

export function defaultRollingRetentionScoreValidator(): RollingRetentionScoreValidator {
  return new RollingRetentionScoreValidator(
    [
      new RollingRetentionScoreWindowDaysRangeRule(16, 255),
      new RollingRetentionScoreCodeLengthRule(64),
      new RollingRetentionScoreCodePrefixRule("REF"),
      new RollingRetentionScoreNameLengthRule(32),
      new RollingRetentionScoreAllowedLabelRule(["global"]),
      new RollingRetentionScoreRequiredCodeRule("rolling retention score needs an entry"),
    ],
  );
}
