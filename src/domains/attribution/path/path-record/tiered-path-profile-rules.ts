import { TieredPathProfile } from "./tiered-path-profile.js";

/** A rule a tiered path profile must pass. Check returns its problems, or none. */
export interface TieredPathProfileRule {
  check(item: TieredPathProfile): string[];
}

export class TieredPathProfileWeightRangeRule implements TieredPathProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPathProfile): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPathProfileClicksRangeRule implements TieredPathProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPathProfile): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPathProfileRequiredCodeRule implements TieredPathProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPathProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPathProfileRequiredChecksumRule implements TieredPathProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPathProfile): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered path profile. */
export class TieredPathProfileValidator {
  rules: TieredPathProfileRule[];

  constructor(rules: TieredPathProfileRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPathProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPathProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPathProfile[]): Map<string, string[]> {
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

export function defaultTieredPathProfileValidator(): TieredPathProfileValidator {
  return new TieredPathProfileValidator(
    [
      new TieredPathProfileWeightRangeRule(8.2, 1756.5),
      new TieredPathProfileClicksRangeRule(32, 80),
      new TieredPathProfileRequiredCodeRule("tiered path profile needs an entry"),
      new TieredPathProfileRequiredChecksumRule("tiered path profile needs a value"),
    ],
  );
}
