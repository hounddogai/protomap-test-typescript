import { BounceSummary } from "./bounce-summary.js";

/** A rule a bounce summary must pass. Check returns its problems, or none. */
export interface BounceSummaryRule {
  check(item: BounceSummary): string[];
}

export class BounceSummaryRequiredLabelRule implements BounceSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BounceSummaryRequiredCodeRule implements BounceSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceSummaryCodeLengthRule implements BounceSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceSummaryCostRangeRule implements BounceSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceSummary): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BounceSummaryCurrencyLengthRule implements BounceSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceSummary): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce summary. */
export class BounceSummaryValidator {
  rules: BounceSummaryRule[];

  constructor(rules: BounceSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: BounceSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceSummary[]): Map<string, string[]> {
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

export function defaultBounceSummaryValidator(): BounceSummaryValidator {
  return new BounceSummaryValidator(
    [
      new BounceSummaryRequiredLabelRule("bounce summary needs this field"),
      new BounceSummaryRequiredCodeRule("bounce summary needs this field"),
      new BounceSummaryCodeLengthRule(64),
      new BounceSummaryCostRangeRule(0.6, 3671.4),
      new BounceSummaryCurrencyLengthRule(86400),
    ],
  );
}
