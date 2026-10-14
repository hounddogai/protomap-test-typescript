import { ScheduledRetentionWindow } from "./scheduled-retention-window.js";

/** A rule a scheduled retention window must pass. Check returns its problems, or none. */
export interface ScheduledRetentionWindowRule {
  check(item: ScheduledRetentionWindow): string[];
}

export class ScheduledRetentionWindowNameLengthRule implements ScheduledRetentionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRetentionWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRetentionWindowOpenRateRangeRule implements ScheduledRetentionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledRetentionWindow): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledRetentionWindowDiscountRangeRule implements ScheduledRetentionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledRetentionWindow): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledRetentionWindowScoreRangeRule implements ScheduledRetentionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledRetentionWindow): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledRetentionWindowCodePrefixRule implements ScheduledRetentionWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledRetentionWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledRetentionWindowRequiredNameRule implements ScheduledRetentionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRetentionWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled retention window. */
export class ScheduledRetentionWindowValidator {
  rules: ScheduledRetentionWindowRule[];

  constructor(rules: ScheduledRetentionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRetentionWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledRetentionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRetentionWindow[]): Map<string, string[]> {
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

export function defaultScheduledRetentionWindowValidator(): ScheduledRetentionWindowValidator {
  return new ScheduledRetentionWindowValidator(
    [
      new ScheduledRetentionWindowNameLengthRule(80),
      new ScheduledRetentionWindowOpenRateRangeRule(4.6, 1430.1),
      new ScheduledRetentionWindowDiscountRangeRule(8.9, 3425.1),
      new ScheduledRetentionWindowScoreRangeRule(1.7, 1834.4),
      new ScheduledRetentionWindowCodePrefixRule("OPS"),
      new ScheduledRetentionWindowRequiredNameRule("scheduled retention window needs a value"),
    ],
  );
}
