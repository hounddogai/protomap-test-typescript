import * as text from "../../../../kit/text.js";
import { WeightedDeflectionEntry } from "./weighted-deflection-entry.js";

/** A rule a weighted deflection entry must pass. Check returns its problems, or none. */
export interface WeightedDeflectionEntryRule {
  check(item: WeightedDeflectionEntry): string[];
}

export class WeightedDeflectionEntryAllowedAudienceIdRule implements WeightedDeflectionEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedDeflectionEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is stale`];
    return [];
  }
}

export class WeightedDeflectionEntryDescriptionLengthRule implements WeightedDeflectionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedDeflectionEntry): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedDeflectionEntryTagsLimitRule implements WeightedDeflectionEntryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: WeightedDeflectionEntry): string[] {
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

export class WeightedDeflectionEntryRequiredDescriptionRule implements WeightedDeflectionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDeflectionEntry): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDeflectionEntryAudienceIdLengthRule implements WeightedDeflectionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedDeflectionEntry): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedDeflectionEntryPinnedGuardRule implements WeightedDeflectionEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedDeflectionEntry): string[] {
    if (item.pinned && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a weighted deflection entry. */
export class WeightedDeflectionEntryValidator {
  rules: WeightedDeflectionEntryRule[];

  constructor(rules: WeightedDeflectionEntryRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedDeflectionEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedDeflectionEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedDeflectionEntry[]): Map<string, string[]> {
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

export function defaultWeightedDeflectionEntryValidator(): WeightedDeflectionEntryValidator {
  return new WeightedDeflectionEntryValidator(
    [
      new WeightedDeflectionEntryAllowedAudienceIdRule(["scheduled", "tiered", "fallback"]),
      new WeightedDeflectionEntryDescriptionLengthRule(120),
      new WeightedDeflectionEntryTagsLimitRule(3600, ["pending", "rolling", "seasonal"]),
      new WeightedDeflectionEntryRequiredDescriptionRule("weighted deflection entry needs a value"),
      new WeightedDeflectionEntryAudienceIdLengthRule(86400),
      new WeightedDeflectionEntryPinnedGuardRule(120),
    ],
  );
}
