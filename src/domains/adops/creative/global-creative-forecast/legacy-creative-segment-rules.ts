import { LegacyCreativeSegment } from "./legacy-creative-segment.js";

/** A rule a legacy creative segment must pass. Check returns its problems, or none. */
export interface LegacyCreativeSegmentRule {
  check(item: LegacyCreativeSegment): string[];
}

export class LegacyCreativeSegmentTitleLengthRule implements LegacyCreativeSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCreativeSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCreativeSegmentScoreRangeRule implements LegacyCreativeSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCreativeSegment): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyCreativeSegmentBudgetRangeRule implements LegacyCreativeSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCreativeSegment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyCreativeSegmentRequiredCategoryRule implements LegacyCreativeSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCreativeSegment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy creative segment. */
export class LegacyCreativeSegmentValidator {
  rules: LegacyCreativeSegmentRule[];

  constructor(rules: LegacyCreativeSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCreativeSegment): string[] {
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

  requireValid(item: LegacyCreativeSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCreativeSegment[]): Map<string, string[]> {
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

export function defaultLegacyCreativeSegmentValidator(): LegacyCreativeSegmentValidator {
  return new LegacyCreativeSegmentValidator(
    [
      new LegacyCreativeSegmentTitleLengthRule(3600),
      new LegacyCreativeSegmentScoreRangeRule(7.2, 198.9),
      new LegacyCreativeSegmentBudgetRangeRule(9.4, 4375.1),
      new LegacyCreativeSegmentRequiredCategoryRule("legacy creative segment needs this field"),
    ],
  );
}
