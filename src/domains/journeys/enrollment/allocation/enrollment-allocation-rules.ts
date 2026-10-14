import { EnrollmentAllocation } from "./enrollment-allocation.js";

/** A rule a enrollment allocation must pass. Check returns its problems, or none. */
export interface EnrollmentAllocationRule {
  check(item: EnrollmentAllocation): string[];
}

export class EnrollmentAllocationRequiredCodeRule implements EnrollmentAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentAllocationCodePrefixRule implements EnrollmentAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentAllocationRequiredChannelRule implements EnrollmentAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentAllocation): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentAllocationCodeLengthRule implements EnrollmentAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentAllocationConversionRateRangeRule implements EnrollmentAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentAllocation): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a enrollment allocation. */
export class EnrollmentAllocationValidator {
  rules: EnrollmentAllocationRule[];

  constructor(rules: EnrollmentAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentAllocation): string[] {
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

  requireValid(item: EnrollmentAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentAllocation[]): Map<string, string[]> {
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

export function defaultEnrollmentAllocationValidator(): EnrollmentAllocationValidator {
  return new EnrollmentAllocationValidator(
    [
      new EnrollmentAllocationRequiredCodeRule("enrollment allocation needs an entry"),
      new EnrollmentAllocationCodePrefixRule("REF"),
      new EnrollmentAllocationRequiredChannelRule("enrollment allocation needs this field"),
      new EnrollmentAllocationCodeLengthRule(16),
      new EnrollmentAllocationConversionRateRangeRule(7, 907.8),
    ],
  );
}
