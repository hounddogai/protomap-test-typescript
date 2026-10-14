import { TierGroup } from "./tier-group.js";

/** A rule a tier group must pass. Check returns its problems, or none. */
export interface TierGroupRule {
  check(item: TierGroup): string[];
}

export class TierGroupStartsAtRangeRule implements TierGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierGroup): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TierGroupUpdatedAtRangeRule implements TierGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierGroup): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierGroupPriorityRangeRule implements TierGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierGroup): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierGroupRequiredCodeRule implements TierGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier group. */
export class TierGroupValidator {
  rules: TierGroupRule[];

  constructor(rules: TierGroupRule[]) {
    this.rules = rules;
  }

  validate(item: TierGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierGroup[]): Map<string, string[]> {
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

export function defaultTierGroupValidator(): TierGroupValidator {
  return new TierGroupValidator(
    [
      new TierGroupStartsAtRangeRule(255, 3600),
      new TierGroupUpdatedAtRangeRule(120, 255),
      new TierGroupPriorityRangeRule(16, 80),
      new TierGroupRequiredCodeRule("tier group needs an entry"),
    ],
  );
}
