import { StrictPostSummary } from "./strict-post-summary.js";

/** A rule a strict post summary must pass. Check returns its problems, or none. */
export interface StrictPostSummaryRule {
  check(item: StrictPostSummary): string[];
}

export class StrictPostSummaryCostRangeRule implements StrictPostSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPostSummary): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPostSummaryCodePrefixRule implements StrictPostSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictPostSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictPostSummaryChannelLengthRule implements StrictPostSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPostSummary): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPostSummaryRequiredChannelRule implements StrictPostSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPostSummary): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPostSummaryTitleLengthRule implements StrictPostSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPostSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict post summary. */
export class StrictPostSummaryValidator {
  rules: StrictPostSummaryRule[];

  constructor(rules: StrictPostSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPostSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPostSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPostSummary[]): Map<string, string[]> {
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

export function defaultStrictPostSummaryValidator(): StrictPostSummaryValidator {
  return new StrictPostSummaryValidator(
    [
      new StrictPostSummaryCostRangeRule(1.2, 3471.3),
      new StrictPostSummaryCodePrefixRule("ACM"),
      new StrictPostSummaryChannelLengthRule(255),
      new StrictPostSummaryRequiredChannelRule("strict post summary needs a value"),
      new StrictPostSummaryTitleLengthRule(120),
    ],
  );
}
