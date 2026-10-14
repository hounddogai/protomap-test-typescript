import { EnrollmentVariance } from "./enrollment-variance.js";

/** A rule a enrollment variance must pass. Check returns its problems, or none. */
export interface EnrollmentVarianceRule {
  check(item: EnrollmentVariance): string[];
}

export class EnrollmentVarianceRequiredChannelRule implements EnrollmentVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentVariance): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentVarianceEndsAtRangeRule implements EnrollmentVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentVariance): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentVarianceChannelLengthRule implements EnrollmentVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentVariance): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentVarianceSendAtRangeRule implements EnrollmentVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentVariance): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentVarianceFrequencyCapRangeRule implements EnrollmentVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentVariance): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a enrollment variance. */
export class EnrollmentVarianceValidator {
  rules: EnrollmentVarianceRule[];

  constructor(rules: EnrollmentVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentVariance): string[] {
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

  requireValid(item: EnrollmentVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentVariance[]): Map<string, string[]> {
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

export function defaultEnrollmentVarianceValidator(): EnrollmentVarianceValidator {
  return new EnrollmentVarianceValidator(
    [
      new EnrollmentVarianceRequiredChannelRule("enrollment variance needs an entry"),
      new EnrollmentVarianceEndsAtRangeRule(255, 3600),
      new EnrollmentVarianceChannelLengthRule(1000),
      new EnrollmentVarianceSendAtRangeRule(120, 1000),
      new EnrollmentVarianceFrequencyCapRangeRule(80, 80),
    ],
  );
}
