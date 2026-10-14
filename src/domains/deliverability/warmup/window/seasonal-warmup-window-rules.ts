import { SeasonalWarmupWindow } from "./seasonal-warmup-window.js";

/** A rule a seasonal warmup window must pass. Check returns its problems, or none. */
export interface SeasonalWarmupWindowRule {
  check(item: SeasonalWarmupWindow): string[];
}

export class SeasonalWarmupWindowRatioRangeRule implements SeasonalWarmupWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalWarmupWindow): string[] {
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

export class SeasonalWarmupWindowTitleLengthRule implements SeasonalWarmupWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWarmupWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalWarmupWindowRequiredOwnerIdRule implements SeasonalWarmupWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWarmupWindow): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal warmup window. */
export class SeasonalWarmupWindowValidator {
  rules: SeasonalWarmupWindowRule[];

  constructor(rules: SeasonalWarmupWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWarmupWindow): string[] {
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

  requireValid(item: SeasonalWarmupWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWarmupWindow[]): Map<string, string[]> {
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

export function defaultSeasonalWarmupWindowValidator(): SeasonalWarmupWindowValidator {
  return new SeasonalWarmupWindowValidator(
    [
      new SeasonalWarmupWindowRatioRangeRule(7.8, 2340.9),
      new SeasonalWarmupWindowTitleLengthRule(16),
      new SeasonalWarmupWindowRequiredOwnerIdRule("seasonal warmup window needs this field"),
    ],
  );
}
