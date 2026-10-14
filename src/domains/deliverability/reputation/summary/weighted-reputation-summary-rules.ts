import { WeightedReputationSummary } from "./weighted-reputation-summary.js";

/** A rule a weighted reputation summary must pass. Check returns its problems, or none. */
export interface WeightedReputationSummaryRule {
  check(item: WeightedReputationSummary): string[];
}

export class WeightedReputationSummaryCodeLengthRule implements WeightedReputationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReputationSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReputationSummaryCodePrefixRule implements WeightedReputationSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedReputationSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedReputationSummaryRequiredTimezoneRule implements WeightedReputationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReputationSummary): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReputationSummaryTimezoneLengthRule implements WeightedReputationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReputationSummary): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReputationSummaryNotesLengthRule implements WeightedReputationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReputationSummary): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted reputation summary. */
export class WeightedReputationSummaryValidator {
  rules: WeightedReputationSummaryRule[];

  constructor(rules: WeightedReputationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedReputationSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedReputationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedReputationSummary[]): Map<string, string[]> {
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

export function defaultWeightedReputationSummaryValidator(): WeightedReputationSummaryValidator {
  return new WeightedReputationSummaryValidator(
    [
      new WeightedReputationSummaryCodeLengthRule(3600),
      new WeightedReputationSummaryCodePrefixRule("X"),
      new WeightedReputationSummaryRequiredTimezoneRule("weighted reputation summary needs this field"),
      new WeightedReputationSummaryTimezoneLengthRule(86400),
      new WeightedReputationSummaryNotesLengthRule(3600),
    ],
  );
}
