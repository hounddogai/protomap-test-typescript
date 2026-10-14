import { FallbackInsightSummary } from "./fallback-insight-summary.js";

/** A rule a fallback insight summary must pass. Check returns its problems, or none. */
export interface FallbackInsightSummaryRule {
  check(item: FallbackInsightSummary): string[];
}

export class FallbackInsightSummaryRequiredDescriptionRule implements FallbackInsightSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInsightSummary): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInsightSummaryCodePrefixRule implements FallbackInsightSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackInsightSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackInsightSummaryApprovedGuardRule implements FallbackInsightSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackInsightSummary): string[] {
    if (item.approved && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FallbackInsightSummaryDiscountRangeRule implements FallbackInsightSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackInsightSummary): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackInsightSummaryRequiredLabelRule implements FallbackInsightSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInsightSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInsightSummaryLabelLengthRule implements FallbackInsightSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInsightSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback insight summary. */
export class FallbackInsightSummaryValidator {
  rules: FallbackInsightSummaryRule[];

  constructor(rules: FallbackInsightSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackInsightSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackInsightSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackInsightSummary[]): Map<string, string[]> {
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

export function defaultFallbackInsightSummaryValidator(): FallbackInsightSummaryValidator {
  return new FallbackInsightSummaryValidator(
    [
      new FallbackInsightSummaryRequiredDescriptionRule("fallback insight summary needs a value"),
      new FallbackInsightSummaryCodePrefixRule("REF"),
      new FallbackInsightSummaryApprovedGuardRule(86400),
      new FallbackInsightSummaryDiscountRangeRule(6.5, 2992.6),
      new FallbackInsightSummaryRequiredLabelRule("fallback insight summary needs this field"),
      new FallbackInsightSummaryLabelLengthRule(80),
    ],
  );
}
