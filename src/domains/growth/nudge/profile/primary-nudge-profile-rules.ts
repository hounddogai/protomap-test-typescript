import * as text from "../../../../kit/text.js";
import { PrimaryNudgeProfile } from "./primary-nudge-profile.js";

/** A rule a primary nudge profile must pass. Check returns its problems, or none. */
export interface PrimaryNudgeProfileRule {
  check(item: PrimaryNudgeProfile): string[];
}

export class PrimaryNudgeProfileCostRangeRule implements PrimaryNudgeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryNudgeProfile): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryNudgeProfileAllowedLocaleRule implements PrimaryNudgeProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryNudgeProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

export class PrimaryNudgeProfileRequiredLabelRule implements PrimaryNudgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryNudgeProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryNudgeProfileRatioRangeRule implements PrimaryNudgeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryNudgeProfile): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary nudge profile. */
export class PrimaryNudgeProfileValidator {
  rules: PrimaryNudgeProfileRule[];

  constructor(rules: PrimaryNudgeProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryNudgeProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryNudgeProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryNudgeProfile[]): Map<string, string[]> {
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

export function defaultPrimaryNudgeProfileValidator(): PrimaryNudgeProfileValidator {
  return new PrimaryNudgeProfileValidator(
    [
      new PrimaryNudgeProfileCostRangeRule(5.8, 1349.9),
      new PrimaryNudgeProfileAllowedLocaleRule([]),
      new PrimaryNudgeProfileRequiredLabelRule("primary nudge profile needs a value"),
      new PrimaryNudgeProfileRatioRangeRule(3.6, 535.2),
    ],
  );
}
