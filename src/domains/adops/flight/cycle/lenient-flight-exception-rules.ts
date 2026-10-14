import { LenientFlightException } from "./lenient-flight-exception.js";

/** A rule a lenient flight exception must pass. Check returns its problems, or none. */
export interface LenientFlightExceptionRule {
  check(item: LenientFlightException): string[];
}

export class LenientFlightExceptionRequiredTitleRule implements LenientFlightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFlightException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFlightExceptionCodePrefixRule implements LenientFlightExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientFlightException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientFlightExceptionScoreRangeRule implements LenientFlightExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFlightException): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientFlightExceptionCodeLengthRule implements LenientFlightExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFlightException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientFlightExceptionRequiredCodeRule implements LenientFlightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFlightException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient flight exception. */
export class LenientFlightExceptionValidator {
  rules: LenientFlightExceptionRule[];

  constructor(rules: LenientFlightExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFlightException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientFlightException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFlightException[]): Map<string, string[]> {
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

export function defaultLenientFlightExceptionValidator(): LenientFlightExceptionValidator {
  return new LenientFlightExceptionValidator(
    [
      new LenientFlightExceptionRequiredTitleRule("lenient flight exception needs a value"),
      new LenientFlightExceptionCodePrefixRule("OPS"),
      new LenientFlightExceptionScoreRangeRule(4.9, 1915.2),
      new LenientFlightExceptionCodeLengthRule(255),
      new LenientFlightExceptionRequiredCodeRule("lenient flight exception needs an entry"),
    ],
  );
}
