import * as text from "../../../../kit/text.js";
import { LegacyTierItem } from "./legacy-tier-item.js";

/** A rule a legacy tier item must pass. Check returns its problems, or none. */
export interface LegacyTierItemRule {
  check(item: LegacyTierItem): string[];
}

export class LegacyTierItemAllowedCurrencyRule implements LegacyTierItemRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyTierItem): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is too long`];
    return [];
  }
}

export class LegacyTierItemPriorityRangeRule implements LegacyTierItemRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTierItem): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyTierItemVersionRangeRule implements LegacyTierItemRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTierItem): string[] {
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

/** Runs every rule of a legacy tier item. */
export class LegacyTierItemValidator {
  rules: LegacyTierItemRule[];

  constructor(rules: LegacyTierItemRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyTierItem): string[] {
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

  requireValid(item: LegacyTierItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyTierItem[]): Map<string, string[]> {
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

export function defaultLegacyTierItemValidator(): LegacyTierItemValidator {
  return new LegacyTierItemValidator(
    [
      new LegacyTierItemAllowedCurrencyRule([]),
      new LegacyTierItemPriorityRangeRule(16, 86400),
      new LegacyTierItemVersionRangeRule(32, 255),
    ],
  );
}
