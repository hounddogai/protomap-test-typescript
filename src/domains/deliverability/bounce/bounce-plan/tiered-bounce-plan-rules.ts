import { TieredBouncePlan } from "./tiered-bounce-plan.js";

/** A rule a tiered bounce plan must pass. Check returns its problems, or none. */
export interface TieredBouncePlanRule {
  check(item: TieredBouncePlan): string[];
}

export class TieredBouncePlanLabelLengthRule implements TieredBouncePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBouncePlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBouncePlanLocaleLengthRule implements TieredBouncePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBouncePlan): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBouncePlanRequiredCodeRule implements TieredBouncePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBouncePlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBouncePlanRequiredLocaleRule implements TieredBouncePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBouncePlan): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered bounce plan. */
export class TieredBouncePlanValidator {
  rules: TieredBouncePlanRule[];

  constructor(rules: TieredBouncePlanRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBouncePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredBouncePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBouncePlan[]): Map<string, string[]> {
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

export function defaultTieredBouncePlanValidator(): TieredBouncePlanValidator {
  return new TieredBouncePlanValidator(
    [
      new TieredBouncePlanLabelLengthRule(1000),
      new TieredBouncePlanLocaleLengthRule(32),
      new TieredBouncePlanRequiredCodeRule("tiered bounce plan needs an entry"),
      new TieredBouncePlanRequiredLocaleRule("tiered bounce plan needs an entry"),
    ],
  );
}
