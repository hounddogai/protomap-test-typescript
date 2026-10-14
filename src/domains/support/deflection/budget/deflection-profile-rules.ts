import { DeflectionProfile } from "./deflection-profile.js";

/** A rule a deflection profile must pass. Check returns its problems, or none. */
export interface DeflectionProfileRule {
  check(item: DeflectionProfile): string[];
}

export class DeflectionProfileNotesLengthRule implements DeflectionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionProfile): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionProfileApprovedGuardRule implements DeflectionProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionProfile): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class DeflectionProfileRequiredCodeRule implements DeflectionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionProfileScoreRangeRule implements DeflectionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionProfile): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionProfileCodePrefixRule implements DeflectionProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a deflection profile. */
export class DeflectionProfileValidator {
  rules: DeflectionProfileRule[];

  constructor(rules: DeflectionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionProfile): string[] {
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

  requireValid(item: DeflectionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionProfile[]): Map<string, string[]> {
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

export function defaultDeflectionProfileValidator(): DeflectionProfileValidator {
  return new DeflectionProfileValidator(
    [
      new DeflectionProfileNotesLengthRule(255),
      new DeflectionProfileApprovedGuardRule(6.2),
      new DeflectionProfileRequiredCodeRule("deflection profile needs an entry"),
      new DeflectionProfileScoreRangeRule(5.7, 403.3),
      new DeflectionProfileCodePrefixRule("X"),
    ],
  );
}
