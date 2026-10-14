import { TieredInviteProfile } from "./tiered-invite-profile.js";

/** A rule a tiered invite profile must pass. Check returns its problems, or none. */
export interface TieredInviteProfileRule {
  check(item: TieredInviteProfile): string[];
}

export class TieredInviteProfileRequiredCodeRule implements TieredInviteProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredInviteProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredInviteProfileCodePrefixRule implements TieredInviteProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredInviteProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredInviteProfileAttemptsRangeRule implements TieredInviteProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredInviteProfile): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredInviteProfileConversionRateRangeRule implements TieredInviteProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredInviteProfile): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredInviteProfileRequiredCountryRule implements TieredInviteProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredInviteProfile): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class TieredInviteProfileRequiredTitleRule implements TieredInviteProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredInviteProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered invite profile. */
export class TieredInviteProfileValidator {
  rules: TieredInviteProfileRule[];

  constructor(rules: TieredInviteProfileRule[]) {
    this.rules = rules;
  }

  validate(item: TieredInviteProfile): string[] {
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

  requireValid(item: TieredInviteProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredInviteProfile[]): Map<string, string[]> {
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

export function defaultTieredInviteProfileValidator(): TieredInviteProfileValidator {
  return new TieredInviteProfileValidator(
    [
      new TieredInviteProfileRequiredCodeRule("tiered invite profile needs an entry"),
      new TieredInviteProfileCodePrefixRule("OPS"),
      new TieredInviteProfileAttemptsRangeRule(120, 255),
      new TieredInviteProfileConversionRateRangeRule(6.4, 3474.1),
      new TieredInviteProfileRequiredCountryRule("tiered invite profile needs a value"),
      new TieredInviteProfileRequiredTitleRule("tiered invite profile needs an entry"),
    ],
  );
}
