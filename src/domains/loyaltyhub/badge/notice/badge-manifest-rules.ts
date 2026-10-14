import * as text from "../../../../kit/text.js";
import { BadgeManifest } from "./badge-manifest.js";

/** A rule a badge manifest must pass. Check returns its problems, or none. */
export interface BadgeManifestRule {
  check(item: BadgeManifest): string[];
}

export class BadgeManifestSequenceRangeRule implements BadgeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeManifest): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeManifestCodeLengthRule implements BadgeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeManifestApprovedGuardRule implements BadgeManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BadgeManifest): string[] {
    if (item.approved && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class BadgeManifestChannelLengthRule implements BadgeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeManifest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeManifestNameLengthRule implements BadgeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeManifestAllowedChannelRule implements BadgeManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is stale`];
    return [];
  }
}

/** Runs every rule of a badge manifest. */
export class BadgeManifestValidator {
  rules: BadgeManifestRule[];

  constructor(rules: BadgeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeManifest[]): Map<string, string[]> {
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

export function defaultBadgeManifestValidator(): BadgeManifestValidator {
  return new BadgeManifestValidator(
    [
      new BadgeManifestSequenceRangeRule(16, 1000),
      new BadgeManifestCodeLengthRule(16),
      new BadgeManifestApprovedGuardRule(1000),
      new BadgeManifestChannelLengthRule(80),
      new BadgeManifestNameLengthRule(64),
      new BadgeManifestAllowedChannelRule([]),
    ],
  );
}
