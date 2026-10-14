import { PathEstimate } from "./path-estimate.js";

/** A rule a path estimate must pass. Check returns its problems, or none. */
export interface PathEstimateRule {
  check(item: PathEstimate): string[];
}

export class PathEstimateTimezoneLengthRule implements PathEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathEstimate): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathEstimateRequiredTimezoneRule implements PathEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathEstimate): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PathEstimateCodePrefixRule implements PathEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathEstimateCodeLengthRule implements PathEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathEstimateWindowRule implements PathEstimateRule {
  maxSpan: number;

  constructor(maxSpan: number) {
    this.maxSpan = maxSpan;
  }

  check(item: PathEstimate): string[] {
    if (item.startsAt > item.endsAt) return ["starts at is after ends at"];
    if (this.maxSpan > 0 && item.endsAt - item.startsAt > this.maxSpan) return [`spans more than ${this.maxSpan} seconds`];
    return [];
  }
}

export class PathEstimateBidRangeRule implements PathEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathEstimate): string[] {
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

/** Runs every rule of a path estimate. */
export class PathEstimateValidator {
  rules: PathEstimateRule[];

  constructor(rules: PathEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PathEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathEstimate[]): Map<string, string[]> {
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

export function defaultPathEstimateValidator(): PathEstimateValidator {
  return new PathEstimateValidator(
    [
      new PathEstimateTimezoneLengthRule(32),
      new PathEstimateRequiredTimezoneRule("path estimate needs a value"),
      new PathEstimateCodePrefixRule("REF"),
      new PathEstimateCodeLengthRule(80),
      new PathEstimateWindowRule(120),
      new PathEstimateBidRangeRule(9.2, 2152.7),
    ],
  );
}
