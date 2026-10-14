import { TieredBadgeAdjustment } from "./tiered-badge-adjustment.js";

/** A rule a tiered badge adjustment must pass. Check returns its problems, or none. */
export interface TieredBadgeAdjustmentRule {
  check(item: TieredBadgeAdjustment): string[];
}

export class TieredBadgeAdjustmentCodeLengthRule implements TieredBadgeAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBadgeAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBadgeAdjustmentRegionLengthRule implements TieredBadgeAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBadgeAdjustment): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBadgeAdjustmentCeilingRangeRule implements TieredBadgeAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBadgeAdjustment): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredBadgeAdjustmentNameLengthRule implements TieredBadgeAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBadgeAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBadgeAdjustmentBatchSizeRangeRule implements TieredBadgeAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBadgeAdjustment): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered badge adjustment. */
export class TieredBadgeAdjustmentValidator {
  rules: TieredBadgeAdjustmentRule[];

  constructor(rules: TieredBadgeAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBadgeAdjustment): string[] {
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

  requireValid(item: TieredBadgeAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBadgeAdjustment[]): Map<string, string[]> {
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

export function defaultTieredBadgeAdjustmentValidator(): TieredBadgeAdjustmentValidator {
  return new TieredBadgeAdjustmentValidator(
    [
      new TieredBadgeAdjustmentCodeLengthRule(86400),
      new TieredBadgeAdjustmentRegionLengthRule(64),
      new TieredBadgeAdjustmentCeilingRangeRule(9.4, 4063.7),
      new TieredBadgeAdjustmentNameLengthRule(64),
      new TieredBadgeAdjustmentBatchSizeRangeRule(120, 3600),
    ],
  );
}
