import * as text from "../../../../kit/text.js";
import { PlacementRollup } from "./placement-rollup.js";

/** A rule a placement rollup must pass. Check returns its problems, or none. */
export interface PlacementRollupRule {
  check(item: PlacementRollup): string[];
}

export class PlacementRollupCodeLengthRule implements PlacementRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementRollupRequiredNameRule implements PlacementRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementRollupRequiredChannelRule implements PlacementRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementRollup): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementRollupAllowedChannelRule implements PlacementRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is duplicated`];
    return [];
  }
}

export class PlacementRollupTagsLimitRule implements PlacementRollupRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PlacementRollup): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class PlacementRollupStartsAtRangeRule implements PlacementRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementRollup): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a placement rollup. */
export class PlacementRollupValidator {
  rules: PlacementRollupRule[];

  constructor(rules: PlacementRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementRollup[]): Map<string, string[]> {
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

export function defaultPlacementRollupValidator(): PlacementRollupValidator {
  return new PlacementRollupValidator(
    [
      new PlacementRollupCodeLengthRule(3600),
      new PlacementRollupRequiredNameRule("placement rollup needs a value"),
      new PlacementRollupRequiredChannelRule("placement rollup needs a value"),
      new PlacementRollupAllowedChannelRule([]),
      new PlacementRollupTagsLimitRule(64, ["legacy"]),
      new PlacementRollupStartsAtRangeRule(16, 1000),
    ],
  );
}
