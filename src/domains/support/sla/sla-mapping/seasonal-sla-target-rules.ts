import * as text from "../../../../kit/text.js";
import { SeasonalSlaTarget } from "./seasonal-sla-target.js";

/** A rule a seasonal sla target must pass. Check returns its problems, or none. */
export interface SeasonalSlaTargetRule {
  check(item: SeasonalSlaTarget): string[];
}

export class SeasonalSlaTargetTitleLengthRule implements SeasonalSlaTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSlaTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSlaTargetWindowDaysRangeRule implements SeasonalSlaTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSlaTarget): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalSlaTargetUtmSourceLengthRule implements SeasonalSlaTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSlaTarget): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSlaTargetAllowedUtmSourceRule implements SeasonalSlaTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalSlaTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is below minimum`];
    return [];
  }
}

/** Runs every rule of a seasonal sla target. */
export class SeasonalSlaTargetValidator {
  rules: SeasonalSlaTargetRule[];

  constructor(rules: SeasonalSlaTargetRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSlaTarget): string[] {
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

  requireValid(item: SeasonalSlaTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSlaTarget[]): Map<string, string[]> {
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

export function defaultSeasonalSlaTargetValidator(): SeasonalSlaTargetValidator {
  return new SeasonalSlaTargetValidator(
    [
      new SeasonalSlaTargetTitleLengthRule(1000),
      new SeasonalSlaTargetWindowDaysRangeRule(64, 80),
      new SeasonalSlaTargetUtmSourceLengthRule(32),
      new SeasonalSlaTargetAllowedUtmSourceRule([]),
    ],
  );
}
