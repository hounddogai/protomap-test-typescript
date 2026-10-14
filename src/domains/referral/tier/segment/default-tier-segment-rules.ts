import { DefaultTierSegment } from "./default-tier-segment.js";

/** A rule a default tier segment must pass. Check returns its problems, or none. */
export interface DefaultTierSegmentRule {
  check(item: DefaultTierSegment): string[];
}

export class DefaultTierSegmentRequiredLabelRule implements DefaultTierSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultTierSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultTierSegmentTagsLimitRule implements DefaultTierSegmentRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: DefaultTierSegment): string[] {
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

export class DefaultTierSegmentPriorityRangeRule implements DefaultTierSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultTierSegment): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultTierSegmentEndsAtRangeRule implements DefaultTierSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultTierSegment): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultTierSegmentBatchSizeRangeRule implements DefaultTierSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultTierSegment): string[] {
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

/** Runs every rule of a default tier segment. */
export class DefaultTierSegmentValidator {
  rules: DefaultTierSegmentRule[];

  constructor(rules: DefaultTierSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultTierSegment): string[] {
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

  requireValid(item: DefaultTierSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultTierSegment[]): Map<string, string[]> {
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

export function defaultDefaultTierSegmentValidator(): DefaultTierSegmentValidator {
  return new DefaultTierSegmentValidator(
    [
      new DefaultTierSegmentRequiredLabelRule("default tier segment needs this field"),
      new DefaultTierSegmentTagsLimitRule(16, []),
      new DefaultTierSegmentPriorityRangeRule(64, 255),
      new DefaultTierSegmentEndsAtRangeRule(255, 3600),
      new DefaultTierSegmentBatchSizeRangeRule(80, 86400),
    ],
  );
}
