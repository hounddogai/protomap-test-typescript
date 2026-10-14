import { TieredBranchProfile } from "./tiered-branch-profile.js";

/** A rule a tiered branch profile must pass. Check returns its problems, or none. */
export interface TieredBranchProfileRule {
  check(item: TieredBranchProfile): string[];
}

export class TieredBranchProfileRequiredCountryRule implements TieredBranchProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBranchProfile): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBranchProfileRequiredPhoneRule implements TieredBranchProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBranchProfile): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBranchProfileRequiredNameRule implements TieredBranchProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBranchProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBranchProfileRatioRangeRule implements TieredBranchProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBranchProfile): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredBranchProfileCodePrefixRule implements TieredBranchProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredBranchProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered branch profile. */
export class TieredBranchProfileValidator {
  rules: TieredBranchProfileRule[];

  constructor(rules: TieredBranchProfileRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBranchProfile): string[] {
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

  requireValid(item: TieredBranchProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBranchProfile[]): Map<string, string[]> {
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

export function defaultTieredBranchProfileValidator(): TieredBranchProfileValidator {
  return new TieredBranchProfileValidator(
    [
      new TieredBranchProfileRequiredCountryRule("tiered branch profile needs this field"),
      new TieredBranchProfileRequiredPhoneRule("tiered branch profile needs a value"),
      new TieredBranchProfileRequiredNameRule("tiered branch profile needs this field"),
      new TieredBranchProfileRatioRangeRule(1.9, 3954.7),
      new TieredBranchProfileCodePrefixRule("X"),
    ],
  );
}
