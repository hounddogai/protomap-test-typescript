import { StrictInsightRequest } from "./strict-insight-request.js";

/** A rule a strict insight request must pass. Check returns its problems, or none. */
export interface StrictInsightRequestRule {
  check(item: StrictInsightRequest): string[];
}

export class StrictInsightRequestExpiresAtRangeRule implements StrictInsightRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictInsightRequest): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictInsightRequestCodePrefixRule implements StrictInsightRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictInsightRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictInsightRequestTitleLengthRule implements StrictInsightRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictInsightRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictInsightRequestRequiredCodeRule implements StrictInsightRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictInsightRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictInsightRequestMaximumRangeRule implements StrictInsightRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictInsightRequest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict insight request. */
export class StrictInsightRequestValidator {
  rules: StrictInsightRequestRule[];

  constructor(rules: StrictInsightRequestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictInsightRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: StrictInsightRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictInsightRequest[]): Map<string, string[]> {
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

export function defaultStrictInsightRequestValidator(): StrictInsightRequestValidator {
  return new StrictInsightRequestValidator(
    [
      new StrictInsightRequestExpiresAtRangeRule(32, 3600),
      new StrictInsightRequestCodePrefixRule("OPS"),
      new StrictInsightRequestTitleLengthRule(1000),
      new StrictInsightRequestRequiredCodeRule("strict insight request needs this field"),
      new StrictInsightRequestMaximumRangeRule(2.1, 986.5),
    ],
  );
}
