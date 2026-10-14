import { PrimaryBounceBatch } from "./primary-bounce-batch.js";

/** A rule a primary bounce batch must pass. Check returns its problems, or none. */
export interface PrimaryBounceBatchRule {
  check(item: PrimaryBounceBatch): string[];
}

export class PrimaryBounceBatchCodePrefixRule implements PrimaryBounceBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryBounceBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryBounceBatchQuantityRangeRule implements PrimaryBounceBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBounceBatch): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryBounceBatchRevisionRangeRule implements PrimaryBounceBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBounceBatch): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary bounce batch. */
export class PrimaryBounceBatchValidator {
  rules: PrimaryBounceBatchRule[];

  constructor(rules: PrimaryBounceBatchRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryBounceBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryBounceBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryBounceBatch[]): Map<string, string[]> {
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

export function defaultPrimaryBounceBatchValidator(): PrimaryBounceBatchValidator {
  return new PrimaryBounceBatchValidator(
    [
      new PrimaryBounceBatchCodePrefixRule("ACM"),
      new PrimaryBounceBatchQuantityRangeRule(64, 255),
      new PrimaryBounceBatchRevisionRangeRule(32, 255),
    ],
  );
}
