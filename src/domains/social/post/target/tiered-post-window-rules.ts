import { TieredPostWindow } from "./tiered-post-window.js";

/** A rule a tiered post window must pass. Check returns its problems, or none. */
export interface TieredPostWindowRule {
  check(item: TieredPostWindow): string[];
}

export class TieredPostWindowRequiredNameRule implements TieredPostWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPostWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPostWindowBidRangeRule implements TieredPostWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPostWindow): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredPostWindowRequiredCategoryRule implements TieredPostWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPostWindow): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPostWindowCreatedAtRangeRule implements TieredPostWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPostWindow): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered post window. */
export class TieredPostWindowValidator {
  rules: TieredPostWindowRule[];

  constructor(rules: TieredPostWindowRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPostWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPostWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPostWindow[]): Map<string, string[]> {
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

export function defaultTieredPostWindowValidator(): TieredPostWindowValidator {
  return new TieredPostWindowValidator(
    [
      new TieredPostWindowRequiredNameRule("tiered post window needs this field"),
      new TieredPostWindowBidRangeRule(5.8, 1083.2),
      new TieredPostWindowRequiredCategoryRule("tiered post window needs a value"),
      new TieredPostWindowCreatedAtRangeRule(255, 86400),
    ],
  );
}
