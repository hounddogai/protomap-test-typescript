import { StreakRollup } from "./streak-rollup.js";

/** A rule a streak rollup must pass. Check returns its problems, or none. */
export interface StreakRollupRule {
  check(item: StreakRollup): string[];
}

export class StreakRollupCohortLengthRule implements StreakRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakRollup): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakRollupRequiredOwnerIdRule implements StreakRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakRollup): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class StreakRollupRequiredCohortRule implements StreakRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakRollup): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class StreakRollupRequiredNameRule implements StreakRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StreakRollupCodeLengthRule implements StreakRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakRollupOwnerIdLengthRule implements StreakRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakRollup): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak rollup. */
export class StreakRollupValidator {
  rules: StreakRollupRule[];

  constructor(rules: StreakRollupRule[]) {
    this.rules = rules;
  }

  validate(item: StreakRollup): string[] {
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

  requireValid(item: StreakRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakRollup[]): Map<string, string[]> {
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

export function defaultStreakRollupValidator(): StreakRollupValidator {
  return new StreakRollupValidator(
    [
      new StreakRollupCohortLengthRule(86400),
      new StreakRollupRequiredOwnerIdRule("streak rollup needs an entry"),
      new StreakRollupRequiredCohortRule("streak rollup needs an entry"),
      new StreakRollupRequiredNameRule("streak rollup needs an entry"),
      new StreakRollupCodeLengthRule(16),
      new StreakRollupOwnerIdLengthRule(64),
    ],
  );
}
