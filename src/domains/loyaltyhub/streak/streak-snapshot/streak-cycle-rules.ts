import { StreakCycle } from "./streak-cycle.js";

/** A rule a streak cycle must pass. Check returns its problems, or none. */
export interface StreakCycleRule {
  check(item: StreakCycle): string[];
}

export class StreakCycleCodePrefixRule implements StreakCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakCycleCodeLengthRule implements StreakCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakCycleApprovedGuardRule implements StreakCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StreakCycle): string[] {
    if (item.approved && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class StreakCycleNameLengthRule implements StreakCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakCycleRequiredCodeRule implements StreakCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakCycleRequiredNameRule implements StreakCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak cycle. */
export class StreakCycleValidator {
  rules: StreakCycleRule[];

  constructor(rules: StreakCycleRule[]) {
    this.rules = rules;
  }

  validate(item: StreakCycle): string[] {
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

  requireValid(item: StreakCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakCycle[]): Map<string, string[]> {
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

export function defaultStreakCycleValidator(): StreakCycleValidator {
  return new StreakCycleValidator(
    [
      new StreakCycleCodePrefixRule("X"),
      new StreakCycleCodeLengthRule(32),
      new StreakCycleApprovedGuardRule(0.2),
      new StreakCycleNameLengthRule(80),
      new StreakCycleRequiredCodeRule("streak cycle needs an entry"),
      new StreakCycleRequiredNameRule("streak cycle needs an entry"),
    ],
  );
}
