import { NudgeEstimate } from "./nudge-estimate.js";

/** A rule a nudge estimate must pass. Check returns its problems, or none. */
export interface NudgeEstimateRule {
  check(item: NudgeEstimate): string[];
}

export class NudgeEstimateSourceLengthRule implements NudgeEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeEstimate): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeEstimateRequiredSegmentRule implements NudgeEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeEstimate): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeEstimateSegmentLengthRule implements NudgeEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeEstimate): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeEstimateCodePrefixRule implements NudgeEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeEstimateRequiredSourceRule implements NudgeEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeEstimate): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeEstimateLabelLengthRule implements NudgeEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge estimate. */
export class NudgeEstimateValidator {
  rules: NudgeEstimateRule[];

  constructor(rules: NudgeEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeEstimate[]): Map<string, string[]> {
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

export function defaultNudgeEstimateValidator(): NudgeEstimateValidator {
  return new NudgeEstimateValidator(
    [
      new NudgeEstimateSourceLengthRule(32),
      new NudgeEstimateRequiredSegmentRule("nudge estimate needs an entry"),
      new NudgeEstimateSegmentLengthRule(3600),
      new NudgeEstimateCodePrefixRule("X"),
      new NudgeEstimateRequiredSourceRule("nudge estimate needs a value"),
      new NudgeEstimateLabelLengthRule(86400),
    ],
  );
}
