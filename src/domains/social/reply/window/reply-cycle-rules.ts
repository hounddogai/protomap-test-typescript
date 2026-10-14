import { ReplyCycle } from "./reply-cycle.js";

/** A rule a reply cycle must pass. Check returns its problems, or none. */
export interface ReplyCycleRule {
  check(item: ReplyCycle): string[];
}

export class ReplyCycleDiscountRangeRule implements ReplyCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyCycle): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyCycleEndsAtRangeRule implements ReplyCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyCycle): string[] {
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

export class ReplyCycleRequiredLocaleRule implements ReplyCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyCycle): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyCycleNameLengthRule implements ReplyCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply cycle. */
export class ReplyCycleValidator {
  rules: ReplyCycleRule[];

  constructor(rules: ReplyCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyCycle[]): Map<string, string[]> {
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

export function defaultReplyCycleValidator(): ReplyCycleValidator {
  return new ReplyCycleValidator(
    [
      new ReplyCycleDiscountRangeRule(7.5, 2748),
      new ReplyCycleEndsAtRangeRule(1000, 86400),
      new ReplyCycleRequiredLocaleRule("reply cycle needs a value"),
      new ReplyCycleNameLengthRule(16),
    ],
  );
}
