import { RegionalInsightScore } from "./regional-insight-score.js";

/** A rule a regional insight score must pass. Check returns its problems, or none. */
export interface RegionalInsightScoreRule {
  check(item: RegionalInsightScore): string[];
}

export class RegionalInsightScoreTimezoneLengthRule implements RegionalInsightScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalInsightScore): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalInsightScoreCodePrefixRule implements RegionalInsightScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalInsightScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalInsightScoreRequiredTimezoneRule implements RegionalInsightScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalInsightScore): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalInsightScoreBudgetRangeRule implements RegionalInsightScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalInsightScore): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalInsightScoreRequiredCodeRule implements RegionalInsightScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalInsightScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalInsightScoreLabelLengthRule implements RegionalInsightScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalInsightScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional insight score. */
export class RegionalInsightScoreValidator {
  rules: RegionalInsightScoreRule[];

  constructor(rules: RegionalInsightScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalInsightScore): string[] {
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

  requireValid(item: RegionalInsightScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalInsightScore[]): Map<string, string[]> {
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

export function defaultRegionalInsightScoreValidator(): RegionalInsightScoreValidator {
  return new RegionalInsightScoreValidator(
    [
      new RegionalInsightScoreTimezoneLengthRule(3600),
      new RegionalInsightScoreCodePrefixRule("X"),
      new RegionalInsightScoreRequiredTimezoneRule("regional insight score needs a value"),
      new RegionalInsightScoreBudgetRangeRule(7, 1580.7),
      new RegionalInsightScoreRequiredCodeRule("regional insight score needs an entry"),
      new RegionalInsightScoreLabelLengthRule(16),
    ],
  );
}
