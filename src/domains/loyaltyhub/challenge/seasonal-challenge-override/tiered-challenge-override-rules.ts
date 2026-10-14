import { TieredChallengeOverride } from "./tiered-challenge-override.js";

/** A rule a tiered challenge override must pass. Check returns its problems, or none. */
export interface TieredChallengeOverrideRule {
  check(item: TieredChallengeOverride): string[];
}

export class TieredChallengeOverrideUnitLengthRule implements TieredChallengeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredChallengeOverride): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredChallengeOverrideChannelLengthRule implements TieredChallengeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredChallengeOverride): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredChallengeOverrideRequiredCodeRule implements TieredChallengeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredChallengeOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered challenge override. */
export class TieredChallengeOverrideValidator {
  rules: TieredChallengeOverrideRule[];

  constructor(rules: TieredChallengeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: TieredChallengeOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredChallengeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredChallengeOverride[]): Map<string, string[]> {
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

export function defaultTieredChallengeOverrideValidator(): TieredChallengeOverrideValidator {
  return new TieredChallengeOverrideValidator(
    [
      new TieredChallengeOverrideUnitLengthRule(120),
      new TieredChallengeOverrideChannelLengthRule(1000),
      new TieredChallengeOverrideRequiredCodeRule("tiered challenge override needs an entry"),
    ],
  );
}
