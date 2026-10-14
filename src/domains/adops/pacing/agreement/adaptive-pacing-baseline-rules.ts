import * as text from "../../../../kit/text.js";
import { AdaptivePacingBaseline } from "./adaptive-pacing-baseline.js";

/** A rule a adaptive pacing baseline must pass. Check returns its problems, or none. */
export interface AdaptivePacingBaselineRule {
  check(item: AdaptivePacingBaseline): string[];
}

export class AdaptivePacingBaselineCostRangeRule implements AdaptivePacingBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePacingBaseline): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptivePacingBaselineTitleLengthRule implements AdaptivePacingBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePacingBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePacingBaselineRequiredAudienceIdRule implements AdaptivePacingBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePacingBaseline): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePacingBaselineAllowedNotesRule implements AdaptivePacingBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptivePacingBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is blocked`];
    return [];
  }
}

/** Runs every rule of a adaptive pacing baseline. */
export class AdaptivePacingBaselineValidator {
  rules: AdaptivePacingBaselineRule[];

  constructor(rules: AdaptivePacingBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePacingBaseline): string[] {
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

  requireValid(item: AdaptivePacingBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePacingBaseline[]): Map<string, string[]> {
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

export function defaultAdaptivePacingBaselineValidator(): AdaptivePacingBaselineValidator {
  return new AdaptivePacingBaselineValidator(
    [
      new AdaptivePacingBaselineCostRangeRule(6.5, 3853.8),
      new AdaptivePacingBaselineTitleLengthRule(32),
      new AdaptivePacingBaselineRequiredAudienceIdRule("adaptive pacing baseline needs a value"),
      new AdaptivePacingBaselineAllowedNotesRule(["legacy", "pending"]),
    ],
  );
}
