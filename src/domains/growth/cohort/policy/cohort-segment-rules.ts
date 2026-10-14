import * as text from "../../../../kit/text.js";
import { CohortSegment } from "./cohort-segment.js";

/** A rule a cohort segment must pass. Check returns its problems, or none. */
export interface CohortSegmentRule {
  check(item: CohortSegment): string[];
}

export class CohortSegmentSegmentLengthRule implements CohortSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortSegment): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortSegmentRequiredCategoryRule implements CohortSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortSegment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class CohortSegmentAllowedTitleRule implements CohortSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class CohortSegmentRequiredCodeRule implements CohortSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CohortSegmentRequiredTitleRule implements CohortSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort segment. */
export class CohortSegmentValidator {
  rules: CohortSegmentRule[];

  constructor(rules: CohortSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: CohortSegment): string[] {
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

  requireValid(item: CohortSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortSegment[]): Map<string, string[]> {
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

export function defaultCohortSegmentValidator(): CohortSegmentValidator {
  return new CohortSegmentValidator(
    [
      new CohortSegmentSegmentLengthRule(1000),
      new CohortSegmentRequiredCategoryRule("cohort segment needs a value"),
      new CohortSegmentAllowedTitleRule([]),
      new CohortSegmentRequiredCodeRule("cohort segment needs an entry"),
      new CohortSegmentRequiredTitleRule("cohort segment needs this field"),
    ],
  );
}
