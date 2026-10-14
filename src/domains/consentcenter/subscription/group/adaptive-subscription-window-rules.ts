import { AdaptiveSubscriptionWindow } from "./adaptive-subscription-window.js";

/** A rule a adaptive subscription window must pass. Check returns its problems, or none. */
export interface AdaptiveSubscriptionWindowRule {
  check(item: AdaptiveSubscriptionWindow): string[];
}

export class AdaptiveSubscriptionWindowSummaryLengthRule implements AdaptiveSubscriptionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSubscriptionWindow): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveSubscriptionWindowStartsAtRangeRule implements AdaptiveSubscriptionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSubscriptionWindow): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveSubscriptionWindowRequiredCodeRule implements AdaptiveSubscriptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSubscriptionWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSubscriptionWindowRequiredSummaryRule implements AdaptiveSubscriptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSubscriptionWindow): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSubscriptionWindowTitleLengthRule implements AdaptiveSubscriptionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSubscriptionWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive subscription window. */
export class AdaptiveSubscriptionWindowValidator {
  rules: AdaptiveSubscriptionWindowRule[];

  constructor(rules: AdaptiveSubscriptionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSubscriptionWindow): string[] {
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

  requireValid(item: AdaptiveSubscriptionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSubscriptionWindow[]): Map<string, string[]> {
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

export function defaultAdaptiveSubscriptionWindowValidator(): AdaptiveSubscriptionWindowValidator {
  return new AdaptiveSubscriptionWindowValidator(
    [
      new AdaptiveSubscriptionWindowSummaryLengthRule(1000),
      new AdaptiveSubscriptionWindowStartsAtRangeRule(80, 80),
      new AdaptiveSubscriptionWindowRequiredCodeRule("adaptive subscription window needs this field"),
      new AdaptiveSubscriptionWindowRequiredSummaryRule("adaptive subscription window needs an entry"),
      new AdaptiveSubscriptionWindowTitleLengthRule(120),
    ],
  );
}
