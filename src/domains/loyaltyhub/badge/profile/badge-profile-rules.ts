import { BadgeProfile } from "./badge-profile.js";

/** A rule a badge profile must pass. Check returns its problems, or none. */
export interface BadgeProfileRule {
  check(item: BadgeProfile): string[];
}

export class BadgeProfileCodeLengthRule implements BadgeProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeProfileRequiredTitleRule implements BadgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeProfileRequiredCodeRule implements BadgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge profile. */
export class BadgeProfileValidator {
  rules: BadgeProfileRule[];

  constructor(rules: BadgeProfileRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeProfile): string[] {
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

  requireValid(item: BadgeProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeProfile[]): Map<string, string[]> {
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

export function defaultBadgeProfileValidator(): BadgeProfileValidator {
  return new BadgeProfileValidator(
    [
      new BadgeProfileCodeLengthRule(86400),
      new BadgeProfileRequiredTitleRule("badge profile needs this field"),
      new BadgeProfileRequiredCodeRule("badge profile needs a value"),
    ],
  );
}
