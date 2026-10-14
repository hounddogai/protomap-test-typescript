import * as text from "../../../../kit/text.js";
import { SeasonalLevelWindow } from "./seasonal-level-window.js";

/** A rule a seasonal level window must pass. Check returns its problems, or none. */
export interface SeasonalLevelWindowRule {
  check(item: SeasonalLevelWindow): string[];
}

export class SeasonalLevelWindowTitleLengthRule implements SeasonalLevelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalLevelWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalLevelWindowCodePrefixRule implements SeasonalLevelWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalLevelWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalLevelWindowMaximumRangeRule implements SeasonalLevelWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalLevelWindow): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalLevelWindowWindowRule implements SeasonalLevelWindowRule {
  maxSpan: number;

  constructor(maxSpan: number) {
    this.maxSpan = maxSpan;
  }

  check(item: SeasonalLevelWindow): string[] {
    if (item.startsAt > item.endsAt) return ["starts at is after ends at"];
    if (this.maxSpan > 0 && item.endsAt - item.startsAt > this.maxSpan) return [`spans more than ${this.maxSpan} seconds`];
    return [];
  }
}

export class SeasonalLevelWindowAllowedNameRule implements SeasonalLevelWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalLevelWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class SeasonalLevelWindowCohortLengthRule implements SeasonalLevelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalLevelWindow): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal level window. */
export class SeasonalLevelWindowValidator {
  rules: SeasonalLevelWindowRule[];

  constructor(rules: SeasonalLevelWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalLevelWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalLevelWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalLevelWindow[]): Map<string, string[]> {
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

export function defaultSeasonalLevelWindowValidator(): SeasonalLevelWindowValidator {
  return new SeasonalLevelWindowValidator(
    [
      new SeasonalLevelWindowTitleLengthRule(120),
      new SeasonalLevelWindowCodePrefixRule("Q"),
      new SeasonalLevelWindowMaximumRangeRule(10, 1895.9),
      new SeasonalLevelWindowWindowRule(120),
      new SeasonalLevelWindowAllowedNameRule([]),
      new SeasonalLevelWindowCohortLengthRule(255),
    ],
  );
}
