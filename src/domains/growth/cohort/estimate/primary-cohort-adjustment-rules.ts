import { PrimaryCohortAdjustment } from "./primary-cohort-adjustment.js";

/** A rule a primary cohort adjustment must pass. Check returns its problems, or none. */
export interface PrimaryCohortAdjustmentRule {
  check(item: PrimaryCohortAdjustment): string[];
}

export class PrimaryCohortAdjustmentRequiredCodeRule implements PrimaryCohortAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCohortAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCohortAdjustmentRequiredAudienceIdRule implements PrimaryCohortAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCohortAdjustment): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCohortAdjustmentCodePrefixRule implements PrimaryCohortAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryCohortAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryCohortAdjustmentRegionLengthRule implements PrimaryCohortAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCohortAdjustment): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCohortAdjustmentRequiredRegionRule implements PrimaryCohortAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCohortAdjustment): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCohortAdjustmentWindowDaysRangeRule implements PrimaryCohortAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryCohortAdjustment): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary cohort adjustment. */
export class PrimaryCohortAdjustmentValidator {
  rules: PrimaryCohortAdjustmentRule[];

  constructor(rules: PrimaryCohortAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCohortAdjustment): string[] {
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

  requireValid(item: PrimaryCohortAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCohortAdjustment[]): Map<string, string[]> {
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

export function defaultPrimaryCohortAdjustmentValidator(): PrimaryCohortAdjustmentValidator {
  return new PrimaryCohortAdjustmentValidator(
    [
      new PrimaryCohortAdjustmentRequiredCodeRule("primary cohort adjustment needs an entry"),
      new PrimaryCohortAdjustmentRequiredAudienceIdRule("primary cohort adjustment needs an entry"),
      new PrimaryCohortAdjustmentCodePrefixRule("X"),
      new PrimaryCohortAdjustmentRegionLengthRule(32),
      new PrimaryCohortAdjustmentRequiredRegionRule("primary cohort adjustment needs a value"),
      new PrimaryCohortAdjustmentWindowDaysRangeRule(32, 80),
    ],
  );
}
