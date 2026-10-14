import { DefaultWarmupSummary } from "./default-warmup-summary.js";

/** A rule a default warmup summary must pass. Check returns its problems, or none. */
export interface DefaultWarmupSummaryRule {
  check(item: DefaultWarmupSummary): string[];
}

export class DefaultWarmupSummaryLocaleLengthRule implements DefaultWarmupSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupSummary): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWarmupSummaryRequiredCodeRule implements DefaultWarmupSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultWarmupSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultWarmupSummaryLabelLengthRule implements DefaultWarmupSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWarmupSummaryRequiredLocaleRule implements DefaultWarmupSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultWarmupSummary): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultWarmupSummaryEndsAtRangeRule implements DefaultWarmupSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultWarmupSummary): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultWarmupSummaryRequiredAudienceIdRule implements DefaultWarmupSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultWarmupSummary): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default warmup summary. */
export class DefaultWarmupSummaryValidator {
  rules: DefaultWarmupSummaryRule[];

  constructor(rules: DefaultWarmupSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultWarmupSummary): string[] {
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

  requireValid(item: DefaultWarmupSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultWarmupSummary[]): Map<string, string[]> {
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

export function defaultDefaultWarmupSummaryValidator(): DefaultWarmupSummaryValidator {
  return new DefaultWarmupSummaryValidator(
    [
      new DefaultWarmupSummaryLocaleLengthRule(32),
      new DefaultWarmupSummaryRequiredCodeRule("default warmup summary needs a value"),
      new DefaultWarmupSummaryLabelLengthRule(16),
      new DefaultWarmupSummaryRequiredLocaleRule("default warmup summary needs an entry"),
      new DefaultWarmupSummaryEndsAtRangeRule(1000, 3600),
      new DefaultWarmupSummaryRequiredAudienceIdRule("default warmup summary needs this field"),
    ],
  );
}
