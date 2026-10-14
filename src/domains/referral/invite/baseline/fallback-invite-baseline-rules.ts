import { FallbackInviteBaseline } from "./fallback-invite-baseline.js";

/** A rule a fallback invite baseline must pass. Check returns its problems, or none. */
export interface FallbackInviteBaselineRule {
  check(item: FallbackInviteBaseline): string[];
}

export class FallbackInviteBaselineMarginRangeRule implements FallbackInviteBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackInviteBaseline): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackInviteBaselineNameLengthRule implements FallbackInviteBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInviteBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackInviteBaselineActiveGuardRule implements FallbackInviteBaselineRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackInviteBaseline): string[] {
    if (item.active && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while active`];
    return [];
  }
}

export class FallbackInviteBaselineCapacityRangeRule implements FallbackInviteBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackInviteBaseline): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackInviteBaselineRequiredCodeRule implements FallbackInviteBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInviteBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInviteBaselinePhoneLengthRule implements FallbackInviteBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInviteBaseline): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback invite baseline. */
export class FallbackInviteBaselineValidator {
  rules: FallbackInviteBaselineRule[];

  constructor(rules: FallbackInviteBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackInviteBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackInviteBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackInviteBaseline[]): Map<string, string[]> {
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

export function defaultFallbackInviteBaselineValidator(): FallbackInviteBaselineValidator {
  return new FallbackInviteBaselineValidator(
    [
      new FallbackInviteBaselineMarginRangeRule(5.4, 595.4),
      new FallbackInviteBaselineNameLengthRule(1000),
      new FallbackInviteBaselineActiveGuardRule(86400),
      new FallbackInviteBaselineCapacityRangeRule(32, 80),
      new FallbackInviteBaselineRequiredCodeRule("fallback invite baseline needs an entry"),
      new FallbackInviteBaselinePhoneLengthRule(80),
    ],
  );
}
