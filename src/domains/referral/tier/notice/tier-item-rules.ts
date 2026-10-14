import { TierItem } from "./tier-item.js";

/** A rule a tier item must pass. Check returns its problems, or none. */
export interface TierItemRule {
  check(item: TierItem): string[];
}

export class TierItemOpenRateRangeRule implements TierItemRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierItem): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TierItemRegionLengthRule implements TierItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierItem): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierItemRequiredNameRule implements TierItemRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierItem): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier item. */
export class TierItemValidator {
  rules: TierItemRule[];

  constructor(rules: TierItemRule[]) {
    this.rules = rules;
  }

  validate(item: TierItem): string[] {
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

  requireValid(item: TierItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierItem[]): Map<string, string[]> {
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

export function defaultTierItemValidator(): TierItemValidator {
  return new TierItemValidator(
    [
      new TierItemOpenRateRangeRule(2.1, 3338.3),
      new TierItemRegionLengthRule(3600),
      new TierItemRequiredNameRule("tier item needs this field"),
    ],
  );
}
