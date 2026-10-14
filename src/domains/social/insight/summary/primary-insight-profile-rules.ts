import * as text from "../../../../kit/text.js";
import { PrimaryInsightProfile } from "./primary-insight-profile.js";

/** A rule a primary insight profile must pass. Check returns its problems, or none. */
export interface PrimaryInsightProfileRule {
  check(item: PrimaryInsightProfile): string[];
}

export class PrimaryInsightProfileAllowedUtmSourceRule implements PrimaryInsightProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryInsightProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is above maximum`];
    return [];
  }
}

export class PrimaryInsightProfileRequiredNameRule implements PrimaryInsightProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryInsightProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryInsightProfileBidRangeRule implements PrimaryInsightProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryInsightProfile): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryInsightProfileNameLengthRule implements PrimaryInsightProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary insight profile. */
export class PrimaryInsightProfileValidator {
  rules: PrimaryInsightProfileRule[];

  constructor(rules: PrimaryInsightProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryInsightProfile): string[] {
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

  requireValid(item: PrimaryInsightProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryInsightProfile[]): Map<string, string[]> {
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

export function defaultPrimaryInsightProfileValidator(): PrimaryInsightProfileValidator {
  return new PrimaryInsightProfileValidator(
    [
      new PrimaryInsightProfileAllowedUtmSourceRule(["capped"]),
      new PrimaryInsightProfileRequiredNameRule("primary insight profile needs an entry"),
      new PrimaryInsightProfileBidRangeRule(0.7, 772.2),
      new PrimaryInsightProfileNameLengthRule(3600),
    ],
  );
}
