import { GlobalInsightThreshold } from "./global-insight-threshold.js";

/** A rule a global insight threshold must pass. Check returns its problems, or none. */
export interface GlobalInsightThresholdRule {
  check(item: GlobalInsightThreshold): string[];
}

export class GlobalInsightThresholdRetriesRangeRule implements GlobalInsightThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalInsightThreshold): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalInsightThresholdRequiredCodeRule implements GlobalInsightThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalInsightThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalInsightThresholdRequiredTitleRule implements GlobalInsightThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalInsightThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalInsightThresholdTitleLengthRule implements GlobalInsightThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalInsightThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalInsightThresholdCodeLengthRule implements GlobalInsightThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalInsightThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalInsightThresholdRequiredCurrencyRule implements GlobalInsightThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalInsightThreshold): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global insight threshold. */
export class GlobalInsightThresholdValidator {
  rules: GlobalInsightThresholdRule[];

  constructor(rules: GlobalInsightThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalInsightThreshold): string[] {
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

  requireValid(item: GlobalInsightThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalInsightThreshold[]): Map<string, string[]> {
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

export function defaultGlobalInsightThresholdValidator(): GlobalInsightThresholdValidator {
  return new GlobalInsightThresholdValidator(
    [
      new GlobalInsightThresholdRetriesRangeRule(120, 3600),
      new GlobalInsightThresholdRequiredCodeRule("global insight threshold needs this field"),
      new GlobalInsightThresholdRequiredTitleRule("global insight threshold needs this field"),
      new GlobalInsightThresholdTitleLengthRule(64),
      new GlobalInsightThresholdCodeLengthRule(32),
      new GlobalInsightThresholdRequiredCurrencyRule("global insight threshold needs a value"),
    ],
  );
}
