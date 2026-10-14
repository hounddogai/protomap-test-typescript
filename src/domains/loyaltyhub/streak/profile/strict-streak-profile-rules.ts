import * as text from "../../../../kit/text.js";
import { StrictStreakProfile } from "./strict-streak-profile.js";

/** A rule a strict streak profile must pass. Check returns its problems, or none. */
export interface StrictStreakProfileRule {
  check(item: StrictStreakProfile): string[];
}

export class StrictStreakProfileAllowedSegmentRule implements StrictStreakProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictStreakProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is missing`];
    return [];
  }
}

export class StrictStreakProfileRequiredCodeRule implements StrictStreakProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictStreakProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictStreakProfileSegmentLengthRule implements StrictStreakProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictStreakProfile): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictStreakProfileCapacityRangeRule implements StrictStreakProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictStreakProfile): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictStreakProfileUtmSourceLengthRule implements StrictStreakProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictStreakProfile): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict streak profile. */
export class StrictStreakProfileValidator {
  rules: StrictStreakProfileRule[];

  constructor(rules: StrictStreakProfileRule[]) {
    this.rules = rules;
  }

  validate(item: StrictStreakProfile): string[] {
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

  requireValid(item: StrictStreakProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictStreakProfile[]): Map<string, string[]> {
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

export function defaultStrictStreakProfileValidator(): StrictStreakProfileValidator {
  return new StrictStreakProfileValidator(
    [
      new StrictStreakProfileAllowedSegmentRule(["manual", "scheduled"]),
      new StrictStreakProfileRequiredCodeRule("strict streak profile needs a value"),
      new StrictStreakProfileSegmentLengthRule(120),
      new StrictStreakProfileCapacityRangeRule(120, 86400),
      new StrictStreakProfileUtmSourceLengthRule(3600),
    ],
  );
}
