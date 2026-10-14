import * as text from "../../../../kit/text.js";
import { BadgeGroup } from "./badge-group.js";

/** A rule a badge group must pass. Check returns its problems, or none. */
export interface BadgeGroupRule {
  check(item: BadgeGroup): string[];
}

export class BadgeGroupGraceDaysRangeRule implements BadgeGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeGroup): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeGroupWindowDaysRangeRule implements BadgeGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeGroup): string[] {
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

export class BadgeGroupAllowedTitleRule implements BadgeGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class BadgeGroupCodePrefixRule implements BadgeGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BadgeGroupRequiredTitleRule implements BadgeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge group. */
export class BadgeGroupValidator {
  rules: BadgeGroupRule[];

  constructor(rules: BadgeGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeGroup): string[] {
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

  requireValid(item: BadgeGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeGroup[]): Map<string, string[]> {
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

export function defaultBadgeGroupValidator(): BadgeGroupValidator {
  return new BadgeGroupValidator(
    [
      new BadgeGroupGraceDaysRangeRule(64, 64),
      new BadgeGroupWindowDaysRangeRule(16, 255),
      new BadgeGroupAllowedTitleRule(["adaptive"]),
      new BadgeGroupCodePrefixRule("X"),
      new BadgeGroupRequiredTitleRule("badge group needs an entry"),
    ],
  );
}
