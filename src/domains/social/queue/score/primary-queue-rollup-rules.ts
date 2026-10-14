import { PrimaryQueueRollup } from "./primary-queue-rollup.js";

/** A rule a primary queue rollup must pass. Check returns its problems, or none. */
export interface PrimaryQueueRollupRule {
  check(item: PrimaryQueueRollup): string[];
}

export class PrimaryQueueRollupTitleLengthRule implements PrimaryQueueRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryQueueRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryQueueRollupRequiredCodeRule implements PrimaryQueueRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryQueueRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryQueueRollupCodePrefixRule implements PrimaryQueueRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryQueueRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryQueueRollupImpressionsRangeRule implements PrimaryQueueRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryQueueRollup): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryQueueRollupCodeLengthRule implements PrimaryQueueRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryQueueRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary queue rollup. */
export class PrimaryQueueRollupValidator {
  rules: PrimaryQueueRollupRule[];

  constructor(rules: PrimaryQueueRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryQueueRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryQueueRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryQueueRollup[]): Map<string, string[]> {
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

export function defaultPrimaryQueueRollupValidator(): PrimaryQueueRollupValidator {
  return new PrimaryQueueRollupValidator(
    [
      new PrimaryQueueRollupTitleLengthRule(255),
      new PrimaryQueueRollupRequiredCodeRule("primary queue rollup needs an entry"),
      new PrimaryQueueRollupCodePrefixRule("REF"),
      new PrimaryQueueRollupImpressionsRangeRule(16, 32),
      new PrimaryQueueRollupCodeLengthRule(86400),
    ],
  );
}
