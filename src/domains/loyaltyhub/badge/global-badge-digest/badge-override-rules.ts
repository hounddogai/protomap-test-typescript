import * as text from "../../../../kit/text.js";
import { BadgeOverride } from "./badge-override.js";

/** A rule a badge override must pass. Check returns its problems, or none. */
export interface BadgeOverrideRule {
  check(item: BadgeOverride): string[];
}

export class BadgeOverrideRequiredChannelRule implements BadgeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeOverride): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeOverrideBatchSizeRangeRule implements BadgeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeOverride): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeOverrideRequiredCodeRule implements BadgeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeOverrideTitleLengthRule implements BadgeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeOverrideAllowedTitleRule implements BadgeOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

/** Runs every rule of a badge override. */
export class BadgeOverrideValidator {
  rules: BadgeOverrideRule[];

  constructor(rules: BadgeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeOverride): string[] {
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

  requireValid(item: BadgeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeOverride[]): Map<string, string[]> {
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

export function defaultBadgeOverrideValidator(): BadgeOverrideValidator {
  return new BadgeOverrideValidator(
    [
      new BadgeOverrideRequiredChannelRule("badge override needs an entry"),
      new BadgeOverrideBatchSizeRangeRule(64, 64),
      new BadgeOverrideRequiredCodeRule("badge override needs an entry"),
      new BadgeOverrideTitleLengthRule(64),
      new BadgeOverrideAllowedTitleRule(["strict", "pending", "weighted"]),
    ],
  );
}
