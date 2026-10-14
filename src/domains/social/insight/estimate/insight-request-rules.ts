import { InsightRequest } from "./insight-request.js";

/** A rule a insight request must pass. Check returns its problems, or none. */
export interface InsightRequestRule {
  check(item: InsightRequest): string[];
}

export class InsightRequestRequiredSegmentRule implements InsightRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightRequest): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class InsightRequestSegmentLengthRule implements InsightRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightRequest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightRequestRequiredCodeRule implements InsightRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightRequestCodePrefixRule implements InsightRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a insight request. */
export class InsightRequestValidator {
  rules: InsightRequestRule[];

  constructor(rules: InsightRequestRule[]) {
    this.rules = rules;
  }

  validate(item: InsightRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightRequest[]): Map<string, string[]> {
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

export function defaultInsightRequestValidator(): InsightRequestValidator {
  return new InsightRequestValidator(
    [
      new InsightRequestRequiredSegmentRule("insight request needs an entry"),
      new InsightRequestSegmentLengthRule(1000),
      new InsightRequestRequiredCodeRule("insight request needs a value"),
      new InsightRequestCodePrefixRule("X"),
    ],
  );
}
