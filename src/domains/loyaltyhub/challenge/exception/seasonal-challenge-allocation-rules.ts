import { SeasonalChallengeAllocation } from "./seasonal-challenge-allocation.js";

/** A rule a seasonal challenge allocation must pass. Check returns its problems, or none. */
export interface SeasonalChallengeAllocationRule {
  check(item: SeasonalChallengeAllocation): string[];
}

export class SeasonalChallengeAllocationRevisionRangeRule implements SeasonalChallengeAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalChallengeAllocation): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalChallengeAllocationFrequencyCapRangeRule implements SeasonalChallengeAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalChallengeAllocation): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalChallengeAllocationVersionRangeRule implements SeasonalChallengeAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalChallengeAllocation): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalChallengeAllocationCodeLengthRule implements SeasonalChallengeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalChallengeAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalChallengeAllocationRequiredRegionRule implements SeasonalChallengeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalChallengeAllocation): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalChallengeAllocationActiveGuardRule implements SeasonalChallengeAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalChallengeAllocation): string[] {
    if (item.active && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a seasonal challenge allocation. */
export class SeasonalChallengeAllocationValidator {
  rules: SeasonalChallengeAllocationRule[];

  constructor(rules: SeasonalChallengeAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalChallengeAllocation): string[] {
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

  requireValid(item: SeasonalChallengeAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalChallengeAllocation[]): Map<string, string[]> {
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

export function defaultSeasonalChallengeAllocationValidator(): SeasonalChallengeAllocationValidator {
  return new SeasonalChallengeAllocationValidator(
    [
      new SeasonalChallengeAllocationRevisionRangeRule(32, 3600),
      new SeasonalChallengeAllocationFrequencyCapRangeRule(16, 120),
      new SeasonalChallengeAllocationVersionRangeRule(3600, 86400),
      new SeasonalChallengeAllocationCodeLengthRule(80),
      new SeasonalChallengeAllocationRequiredRegionRule("seasonal challenge allocation needs a value"),
      new SeasonalChallengeAllocationActiveGuardRule(255),
    ],
  );
}
