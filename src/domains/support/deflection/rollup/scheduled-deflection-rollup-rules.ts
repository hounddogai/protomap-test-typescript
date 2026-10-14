import { ScheduledDeflectionRollup } from "./scheduled-deflection-rollup.js";

/** A rule a scheduled deflection rollup must pass. Check returns its problems, or none. */
export interface ScheduledDeflectionRollupRule {
  check(item: ScheduledDeflectionRollup): string[];
}

export class ScheduledDeflectionRollupOwnerIdLengthRule implements ScheduledDeflectionRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionRollup): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDeflectionRollupRequiredOwnerIdRule implements ScheduledDeflectionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDeflectionRollup): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDeflectionRollupVersionRangeRule implements ScheduledDeflectionRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDeflectionRollup): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledDeflectionRollupCodeLengthRule implements ScheduledDeflectionRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDeflectionRollupRequiredNameRule implements ScheduledDeflectionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDeflectionRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled deflection rollup. */
export class ScheduledDeflectionRollupValidator {
  rules: ScheduledDeflectionRollupRule[];

  constructor(rules: ScheduledDeflectionRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDeflectionRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledDeflectionRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDeflectionRollup[]): Map<string, string[]> {
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

export function defaultScheduledDeflectionRollupValidator(): ScheduledDeflectionRollupValidator {
  return new ScheduledDeflectionRollupValidator(
    [
      new ScheduledDeflectionRollupOwnerIdLengthRule(80),
      new ScheduledDeflectionRollupRequiredOwnerIdRule("scheduled deflection rollup needs this field"),
      new ScheduledDeflectionRollupVersionRangeRule(16, 32),
      new ScheduledDeflectionRollupCodeLengthRule(1000),
      new ScheduledDeflectionRollupRequiredNameRule("scheduled deflection rollup needs this field"),
    ],
  );
}
