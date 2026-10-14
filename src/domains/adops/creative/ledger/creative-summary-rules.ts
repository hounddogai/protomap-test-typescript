import { CreativeSummary } from "./creative-summary.js";

/** A rule a creative summary must pass. Check returns its problems, or none. */
export interface CreativeSummaryRule {
  check(item: CreativeSummary): string[];
}

export class CreativeSummaryRetriesRangeRule implements CreativeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeSummary): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeSummaryLocaleLengthRule implements CreativeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeSummary): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeSummaryRequiredCodeRule implements CreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeSummaryCodePrefixRule implements CreativeSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeSummaryRequiredSummaryRule implements CreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeSummary): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a creative summary. */
export class CreativeSummaryValidator {
  rules: CreativeSummaryRule[];

  constructor(rules: CreativeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeSummary[]): Map<string, string[]> {
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

export function defaultCreativeSummaryValidator(): CreativeSummaryValidator {
  return new CreativeSummaryValidator(
    [
      new CreativeSummaryRetriesRangeRule(255, 3600),
      new CreativeSummaryLocaleLengthRule(120),
      new CreativeSummaryRequiredCodeRule("creative summary needs this field"),
      new CreativeSummaryCodePrefixRule("ACM"),
      new CreativeSummaryRequiredSummaryRule("creative summary needs a value"),
    ],
  );
}
