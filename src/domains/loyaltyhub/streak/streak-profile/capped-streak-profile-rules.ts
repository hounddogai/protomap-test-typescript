import { CappedStreakProfile } from "./capped-streak-profile.js";

/** A rule a capped streak profile must pass. Check returns its problems, or none. */
export interface CappedStreakProfileRule {
  check(item: CappedStreakProfile): string[];
}

export class CappedStreakProfileArchivedGuardRule implements CappedStreakProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedStreakProfile): string[] {
    if (item.archived && item.floorValue > this.limit) return [`floor value ${item.floorValue} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class CappedStreakProfileCodeLengthRule implements CappedStreakProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStreakProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedStreakProfileRequiredLocaleRule implements CappedStreakProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStreakProfile): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped streak profile. */
export class CappedStreakProfileValidator {
  rules: CappedStreakProfileRule[];

  constructor(rules: CappedStreakProfileRule[]) {
    this.rules = rules;
  }

  validate(item: CappedStreakProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedStreakProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedStreakProfile[]): Map<string, string[]> {
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

export function defaultCappedStreakProfileValidator(): CappedStreakProfileValidator {
  return new CappedStreakProfileValidator(
    [
      new CappedStreakProfileArchivedGuardRule(6.4),
      new CappedStreakProfileCodeLengthRule(3600),
      new CappedStreakProfileRequiredLocaleRule("capped streak profile needs an entry"),
    ],
  );
}
