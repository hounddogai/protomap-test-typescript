import { FallbackComplaintException } from "./fallback-complaint-exception.js";

/** A rule a fallback complaint exception must pass. Check returns its problems, or none. */
export interface FallbackComplaintExceptionRule {
  check(item: FallbackComplaintException): string[];
}

export class FallbackComplaintExceptionTitleLengthRule implements FallbackComplaintExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackComplaintException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackComplaintExceptionTimezoneLengthRule implements FallbackComplaintExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackComplaintException): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackComplaintExceptionFrequencyCapRangeRule implements FallbackComplaintExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackComplaintException): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackComplaintExceptionCodePrefixRule implements FallbackComplaintExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackComplaintException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackComplaintExceptionFloorValueRangeRule implements FallbackComplaintExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackComplaintException): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback complaint exception. */
export class FallbackComplaintExceptionValidator {
  rules: FallbackComplaintExceptionRule[];

  constructor(rules: FallbackComplaintExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackComplaintException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackComplaintException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackComplaintException[]): Map<string, string[]> {
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

export function defaultFallbackComplaintExceptionValidator(): FallbackComplaintExceptionValidator {
  return new FallbackComplaintExceptionValidator(
    [
      new FallbackComplaintExceptionTitleLengthRule(255),
      new FallbackComplaintExceptionTimezoneLengthRule(80),
      new FallbackComplaintExceptionFrequencyCapRangeRule(64, 1000),
      new FallbackComplaintExceptionCodePrefixRule("Q"),
      new FallbackComplaintExceptionFloorValueRangeRule(8.7, 3828.3),
    ],
  );
}
