import * as text from "../../../../kit/text.js";
import { StrictSubscriptionWindow } from "./strict-subscription-window.js";

/** A rule a strict subscription window must pass. Check returns its problems, or none. */
export interface StrictSubscriptionWindowRule {
  check(item: StrictSubscriptionWindow): string[];
}

export class StrictSubscriptionWindowRequiredLabelRule implements StrictSubscriptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSubscriptionWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSubscriptionWindowAllowedLabelRule implements StrictSubscriptionWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictSubscriptionWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class StrictSubscriptionWindowStartsAtRangeRule implements StrictSubscriptionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictSubscriptionWindow): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictSubscriptionWindowCodePrefixRule implements StrictSubscriptionWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictSubscriptionWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict subscription window. */
export class StrictSubscriptionWindowValidator {
  rules: StrictSubscriptionWindowRule[];

  constructor(rules: StrictSubscriptionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: StrictSubscriptionWindow): string[] {
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

  requireValid(item: StrictSubscriptionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictSubscriptionWindow[]): Map<string, string[]> {
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

export function defaultStrictSubscriptionWindowValidator(): StrictSubscriptionWindowValidator {
  return new StrictSubscriptionWindowValidator(
    [
      new StrictSubscriptionWindowRequiredLabelRule("strict subscription window needs an entry"),
      new StrictSubscriptionWindowAllowedLabelRule([]),
      new StrictSubscriptionWindowStartsAtRangeRule(16, 32),
      new StrictSubscriptionWindowCodePrefixRule("ACM"),
    ],
  );
}
