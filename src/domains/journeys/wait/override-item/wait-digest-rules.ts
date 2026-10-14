import { WaitDigest } from "./wait-digest.js";

/** A rule a wait digest must pass. Check returns its problems, or none. */
export interface WaitDigestRule {
  check(item: WaitDigest): string[];
}

export class WaitDigestRequiredCodeRule implements WaitDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitDigestLocaleLengthRule implements WaitDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitDigest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitDigestDurationMinutesRangeRule implements WaitDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitDigest): string[] {
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

/** Runs every rule of a wait digest. */
export class WaitDigestValidator {
  rules: WaitDigestRule[];

  constructor(rules: WaitDigestRule[]) {
    this.rules = rules;
  }

  validate(item: WaitDigest): string[] {
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

  requireValid(item: WaitDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitDigest[]): Map<string, string[]> {
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

export function defaultWaitDigestValidator(): WaitDigestValidator {
  return new WaitDigestValidator(
    [
      new WaitDigestRequiredCodeRule("wait digest needs an entry"),
      new WaitDigestLocaleLengthRule(255),
      new WaitDigestDurationMinutesRangeRule(64, 3600),
    ],
  );
}
