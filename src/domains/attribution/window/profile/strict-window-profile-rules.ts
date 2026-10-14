import { StrictWindowProfile } from "./strict-window-profile.js";

/** A rule a strict window profile must pass. Check returns its problems, or none. */
export interface StrictWindowProfileRule {
  check(item: StrictWindowProfile): string[];
}

export class StrictWindowProfileRateRangeRule implements StrictWindowProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictWindowProfile): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictWindowProfileCodeLengthRule implements StrictWindowProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWindowProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWindowProfileSourceLengthRule implements StrictWindowProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWindowProfile): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWindowProfileDurationMinutesRangeRule implements StrictWindowProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictWindowProfile): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictWindowProfilePinnedGuardRule implements StrictWindowProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictWindowProfile): string[] {
    if (item.pinned && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class StrictWindowProfileRequiredNameRule implements StrictWindowProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWindowProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict window profile. */
export class StrictWindowProfileValidator {
  rules: StrictWindowProfileRule[];

  constructor(rules: StrictWindowProfileRule[]) {
    this.rules = rules;
  }

  validate(item: StrictWindowProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictWindowProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictWindowProfile[]): Map<string, string[]> {
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

export function defaultStrictWindowProfileValidator(): StrictWindowProfileValidator {
  return new StrictWindowProfileValidator(
    [
      new StrictWindowProfileRateRangeRule(0.8, 1532),
      new StrictWindowProfileCodeLengthRule(1000),
      new StrictWindowProfileSourceLengthRule(32),
      new StrictWindowProfileDurationMinutesRangeRule(32, 120),
      new StrictWindowProfilePinnedGuardRule(80),
      new StrictWindowProfileRequiredNameRule("strict window profile needs an entry"),
    ],
  );
}
