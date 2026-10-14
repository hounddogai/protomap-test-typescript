import { LevelClaim } from "./level-claim.js";

/** A rule a level claim must pass. Check returns its problems, or none. */
export interface LevelClaimRule {
  check(item: LevelClaim): string[];
}

export class LevelClaimRequiredPhoneRule implements LevelClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelClaim): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LevelClaimVersionRangeRule implements LevelClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelClaim): string[] {
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

export class LevelClaimRequiredTitleRule implements LevelClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level claim. */
export class LevelClaimValidator {
  rules: LevelClaimRule[];

  constructor(rules: LevelClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LevelClaim): string[] {
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

  requireValid(item: LevelClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelClaim[]): Map<string, string[]> {
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

export function defaultLevelClaimValidator(): LevelClaimValidator {
  return new LevelClaimValidator(
    [
      new LevelClaimRequiredPhoneRule("level claim needs this field"),
      new LevelClaimVersionRangeRule(80, 120),
      new LevelClaimRequiredTitleRule("level claim needs a value"),
    ],
  );
}
