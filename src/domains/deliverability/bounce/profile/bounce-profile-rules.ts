import { BounceProfile } from "./bounce-profile.js";

/** A rule a bounce profile must pass. Check returns its problems, or none. */
export interface BounceProfileRule {
  check(item: BounceProfile): string[];
}

export class BounceProfileRequiredCodeRule implements BounceProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceProfileRequiredLabelRule implements BounceProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BounceProfileLabelLengthRule implements BounceProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceProfileCreatedAtRangeRule implements BounceProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceProfile): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BounceProfileRequiredChecksumRule implements BounceProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceProfile): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bounce profile. */
export class BounceProfileValidator {
  rules: BounceProfileRule[];

  constructor(rules: BounceProfileRule[]) {
    this.rules = rules;
  }

  validate(item: BounceProfile): string[] {
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

  requireValid(item: BounceProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceProfile[]): Map<string, string[]> {
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

export function defaultBounceProfileValidator(): BounceProfileValidator {
  return new BounceProfileValidator(
    [
      new BounceProfileRequiredCodeRule("bounce profile needs a value"),
      new BounceProfileRequiredLabelRule("bounce profile needs this field"),
      new BounceProfileLabelLengthRule(120),
      new BounceProfileCreatedAtRangeRule(64, 86400),
      new BounceProfileRequiredChecksumRule("bounce profile needs this field"),
    ],
  );
}
