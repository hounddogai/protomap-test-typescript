import { LegacyChallengeTarget } from "./legacy-challenge-target.js";

/** A rule a legacy challenge target must pass. Check returns its problems, or none. */
export interface LegacyChallengeTargetRule {
  check(item: LegacyChallengeTarget): string[];
}

export class LegacyChallengeTargetRequiredLocaleRule implements LegacyChallengeTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyChallengeTarget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyChallengeTargetQuantityRangeRule implements LegacyChallengeTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyChallengeTarget): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyChallengeTargetCapacityRangeRule implements LegacyChallengeTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyChallengeTarget): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy challenge target. */
export class LegacyChallengeTargetValidator {
  rules: LegacyChallengeTargetRule[];

  constructor(rules: LegacyChallengeTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyChallengeTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyChallengeTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyChallengeTarget[]): Map<string, string[]> {
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

export function defaultLegacyChallengeTargetValidator(): LegacyChallengeTargetValidator {
  return new LegacyChallengeTargetValidator(
    [
      new LegacyChallengeTargetRequiredLocaleRule("legacy challenge target needs an entry"),
      new LegacyChallengeTargetQuantityRangeRule(32, 255),
      new LegacyChallengeTargetCapacityRangeRule(3600, 86400),
    ],
  );
}
