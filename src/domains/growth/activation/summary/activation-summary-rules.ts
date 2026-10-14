import { ActivationSummary } from "./activation-summary.js";

/** A rule a activation summary must pass. Check returns its problems, or none. */
export interface ActivationSummaryRule {
  check(item: ActivationSummary): string[];
}

export class ActivationSummaryCodeLengthRule implements ActivationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationSummaryCodePrefixRule implements ActivationSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationSummaryBatchSizeRangeRule implements ActivationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationSummary): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationSummaryRequiredCodeRule implements ActivationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation summary. */
export class ActivationSummaryValidator {
  rules: ActivationSummaryRule[];

  constructor(rules: ActivationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationSummary[]): Map<string, string[]> {
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

export function defaultActivationSummaryValidator(): ActivationSummaryValidator {
  return new ActivationSummaryValidator(
    [
      new ActivationSummaryCodeLengthRule(3600),
      new ActivationSummaryCodePrefixRule("ACM"),
      new ActivationSummaryBatchSizeRangeRule(64, 80),
      new ActivationSummaryRequiredCodeRule("activation summary needs a value"),
    ],
  );
}
