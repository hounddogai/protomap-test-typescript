import { NudgeProfile } from "./nudge-profile.js";

/** A rule a nudge profile must pass. Check returns its problems, or none. */
export interface NudgeProfileRule {
  check(item: NudgeProfile): string[];
}

export class NudgeProfileRequiredCodeRule implements NudgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeProfileRevisionRangeRule implements NudgeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeProfile): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeProfileNameLengthRule implements NudgeProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeProfileRetriesRangeRule implements NudgeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeProfile): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a nudge profile. */
export class NudgeProfileValidator {
  rules: NudgeProfileRule[];

  constructor(rules: NudgeProfileRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeProfile): string[] {
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

  requireValid(item: NudgeProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeProfile[]): Map<string, string[]> {
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

export function defaultNudgeProfileValidator(): NudgeProfileValidator {
  return new NudgeProfileValidator(
    [
      new NudgeProfileRequiredCodeRule("nudge profile needs an entry"),
      new NudgeProfileRevisionRangeRule(16, 64),
      new NudgeProfileNameLengthRule(16),
      new NudgeProfileRetriesRangeRule(32, 255),
    ],
  );
}
