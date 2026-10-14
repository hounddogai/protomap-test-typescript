import { TierSegment } from "./tier-segment.js";

/** A rule a tier segment must pass. Check returns its problems, or none. */
export interface TierSegmentRule {
  check(item: TierSegment): string[];
}

export class TierSegmentTagsLimitRule implements TierSegmentRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TierSegment): string[] {
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

export class TierSegmentCodePrefixRule implements TierSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TierSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TierSegmentTitleLengthRule implements TierSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier segment. */
export class TierSegmentValidator {
  rules: TierSegmentRule[];

  constructor(rules: TierSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: TierSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierSegment[]): Map<string, string[]> {
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

export function defaultTierSegmentValidator(): TierSegmentValidator {
  return new TierSegmentValidator(
    [
      new TierSegmentTagsLimitRule(32, ["strict", "scheduled"]),
      new TierSegmentCodePrefixRule("X"),
      new TierSegmentTitleLengthRule(86400),
    ],
  );
}
