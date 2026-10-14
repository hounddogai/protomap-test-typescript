import { StrictRedemptionWindow } from "./strict-redemption-window.js";

/** A rule a strict redemption window must pass. Check returns its problems, or none. */
export interface StrictRedemptionWindowRule {
  check(item: StrictRedemptionWindow): string[];
}

export class StrictRedemptionWindowRequiredSummaryRule implements StrictRedemptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRedemptionWindow): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRedemptionWindowCodeLengthRule implements StrictRedemptionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRedemptionWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRedemptionWindowSummaryLengthRule implements StrictRedemptionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRedemptionWindow): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict redemption window. */
export class StrictRedemptionWindowValidator {
  rules: StrictRedemptionWindowRule[];

  constructor(rules: StrictRedemptionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRedemptionWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictRedemptionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRedemptionWindow[]): Map<string, string[]> {
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

export function defaultStrictRedemptionWindowValidator(): StrictRedemptionWindowValidator {
  return new StrictRedemptionWindowValidator(
    [
      new StrictRedemptionWindowRequiredSummaryRule("strict redemption window needs an entry"),
      new StrictRedemptionWindowCodeLengthRule(1000),
      new StrictRedemptionWindowSummaryLengthRule(80),
    ],
  );
}
