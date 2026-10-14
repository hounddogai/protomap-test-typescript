import { RedemptionWindow } from "./redemption-window.js";

/** A rule a redemption window must pass. Check returns its problems, or none. */
export interface RedemptionWindowRule {
  check(item: RedemptionWindow): string[];
}

export class RedemptionWindowBatchSizeRangeRule implements RedemptionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionWindow): string[] {
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

export class RedemptionWindowCodeLengthRule implements RedemptionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionWindowRequiredTitleRule implements RedemptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionWindowDurationMinutesRangeRule implements RedemptionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionWindow): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a redemption window. */
export class RedemptionWindowValidator {
  rules: RedemptionWindowRule[];

  constructor(rules: RedemptionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionWindow): string[] {
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

  requireValid(item: RedemptionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionWindow[]): Map<string, string[]> {
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

export function defaultRedemptionWindowValidator(): RedemptionWindowValidator {
  return new RedemptionWindowValidator(
    [
      new RedemptionWindowBatchSizeRangeRule(16, 255),
      new RedemptionWindowCodeLengthRule(80),
      new RedemptionWindowRequiredTitleRule("redemption window needs this field"),
      new RedemptionWindowDurationMinutesRangeRule(80, 255),
    ],
  );
}
