import * as text from "../../../../kit/text.js";
import { BadgeCheckpoint } from "./badge-checkpoint.js";

/** A rule a badge checkpoint must pass. Check returns its problems, or none. */
export interface BadgeCheckpointRule {
  check(item: BadgeCheckpoint): string[];
}

export class BadgeCheckpointTimezoneLengthRule implements BadgeCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeCheckpoint): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeCheckpointNameLengthRule implements BadgeCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeCheckpointAllowedNameRule implements BadgeCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class BadgeCheckpointRetriesRangeRule implements BadgeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeCheckpoint): string[] {
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

export class BadgeCheckpointOpenRateRangeRule implements BadgeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeCheckpoint): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeCheckpointImpressionsRangeRule implements BadgeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeCheckpoint): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a badge checkpoint. */
export class BadgeCheckpointValidator {
  rules: BadgeCheckpointRule[];

  constructor(rules: BadgeCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeCheckpoint): string[] {
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

  requireValid(item: BadgeCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeCheckpoint[]): Map<string, string[]> {
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

export function defaultBadgeCheckpointValidator(): BadgeCheckpointValidator {
  return new BadgeCheckpointValidator(
    [
      new BadgeCheckpointTimezoneLengthRule(1000),
      new BadgeCheckpointNameLengthRule(120),
      new BadgeCheckpointAllowedNameRule([]),
      new BadgeCheckpointRetriesRangeRule(64, 86400),
      new BadgeCheckpointOpenRateRangeRule(6.3, 3099.6),
      new BadgeCheckpointImpressionsRangeRule(255, 86400),
    ],
  );
}
