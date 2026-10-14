import { WeightedPostOverride } from "./weighted-post-override.js";

/** A rule a weighted post override must pass. Check returns its problems, or none. */
export interface WeightedPostOverrideRule {
  check(item: WeightedPostOverride): string[];
}

export class WeightedPostOverrideTagsLimitRule implements WeightedPostOverrideRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: WeightedPostOverride): string[] {
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

export class WeightedPostOverrideRegionLengthRule implements WeightedPostOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPostOverride): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPostOverrideRequiredNameRule implements WeightedPostOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPostOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted post override. */
export class WeightedPostOverrideValidator {
  rules: WeightedPostOverrideRule[];

  constructor(rules: WeightedPostOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPostOverride): string[] {
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

  requireValid(item: WeightedPostOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPostOverride[]): Map<string, string[]> {
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

export function defaultWeightedPostOverrideValidator(): WeightedPostOverrideValidator {
  return new WeightedPostOverrideValidator(
    [
      new WeightedPostOverrideTagsLimitRule(32, ["strict"]),
      new WeightedPostOverrideRegionLengthRule(120),
      new WeightedPostOverrideRequiredNameRule("weighted post override needs this field"),
    ],
  );
}
