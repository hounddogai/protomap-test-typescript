import * as text from "../../../../kit/text.js";
import { RollingWaitProfile } from "./rolling-wait-profile.js";

/** A rule a rolling wait profile must pass. Check returns its problems, or none. */
export interface RollingWaitProfileRule {
  check(item: RollingWaitProfile): string[];
}

export class RollingWaitProfileMarginRangeRule implements RollingWaitProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWaitProfile): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingWaitProfileConversionRateRangeRule implements RollingWaitProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWaitProfile): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingWaitProfileAllowedNameRule implements RollingWaitProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingWaitProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class RollingWaitProfileRequiredNameRule implements RollingWaitProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWaitProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWaitProfileRequiredOwnerIdRule implements RollingWaitProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWaitProfile): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWaitProfileCodeLengthRule implements RollingWaitProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWaitProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling wait profile. */
export class RollingWaitProfileValidator {
  rules: RollingWaitProfileRule[];

  constructor(rules: RollingWaitProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWaitProfile): string[] {
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

  requireValid(item: RollingWaitProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWaitProfile[]): Map<string, string[]> {
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

export function defaultRollingWaitProfileValidator(): RollingWaitProfileValidator {
  return new RollingWaitProfileValidator(
    [
      new RollingWaitProfileMarginRangeRule(5.8, 1777.5),
      new RollingWaitProfileConversionRateRangeRule(6.6, 3589.8),
      new RollingWaitProfileAllowedNameRule(["manual", "global"]),
      new RollingWaitProfileRequiredNameRule("rolling wait profile needs a value"),
      new RollingWaitProfileRequiredOwnerIdRule("rolling wait profile needs an entry"),
      new RollingWaitProfileCodeLengthRule(80),
    ],
  );
}
