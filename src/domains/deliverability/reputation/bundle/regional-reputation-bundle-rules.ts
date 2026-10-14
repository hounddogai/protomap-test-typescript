import { RegionalReputationBundle } from "./regional-reputation-bundle.js";

/** A rule a regional reputation bundle must pass. Check returns its problems, or none. */
export interface RegionalReputationBundleRule {
  check(item: RegionalReputationBundle): string[];
}

export class RegionalReputationBundleImpressionsRangeRule implements RegionalReputationBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReputationBundle): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalReputationBundleVariantLengthRule implements RegionalReputationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReputationBundle): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalReputationBundleUnitLengthRule implements RegionalReputationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReputationBundle): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalReputationBundleLimitRangeRule implements RegionalReputationBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReputationBundle): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalReputationBundleRequiredCodeRule implements RegionalReputationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReputationBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReputationBundleRequiredVariantRule implements RegionalReputationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReputationBundle): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional reputation bundle. */
export class RegionalReputationBundleValidator {
  rules: RegionalReputationBundleRule[];

  constructor(rules: RegionalReputationBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalReputationBundle): string[] {
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

  requireValid(item: RegionalReputationBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalReputationBundle[]): Map<string, string[]> {
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

export function defaultRegionalReputationBundleValidator(): RegionalReputationBundleValidator {
  return new RegionalReputationBundleValidator(
    [
      new RegionalReputationBundleImpressionsRangeRule(120, 1000),
      new RegionalReputationBundleVariantLengthRule(86400),
      new RegionalReputationBundleUnitLengthRule(64),
      new RegionalReputationBundleLimitRangeRule(80, 86400),
      new RegionalReputationBundleRequiredCodeRule("regional reputation bundle needs an entry"),
      new RegionalReputationBundleRequiredVariantRule("regional reputation bundle needs this field"),
    ],
  );
}
