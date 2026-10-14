import * as text from "../../../../kit/text.js";
import { GlobalStepProfile } from "./global-step-profile.js";

/** A rule a global step profile must pass. Check returns its problems, or none. */
export interface GlobalStepProfileRule {
  check(item: GlobalStepProfile): string[];
}

export class GlobalStepProfileSequenceRangeRule implements GlobalStepProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalStepProfile): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalStepProfileRequiredCountryRule implements GlobalStepProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalStepProfile): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalStepProfileGraceDaysRangeRule implements GlobalStepProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalStepProfile): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalStepProfileCodePrefixRule implements GlobalStepProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalStepProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalStepProfileAllowedCodeRule implements GlobalStepProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalStepProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class GlobalStepProfileCountryLengthRule implements GlobalStepProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStepProfile): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global step profile. */
export class GlobalStepProfileValidator {
  rules: GlobalStepProfileRule[];

  constructor(rules: GlobalStepProfileRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalStepProfile): string[] {
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

  requireValid(item: GlobalStepProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalStepProfile[]): Map<string, string[]> {
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

export function defaultGlobalStepProfileValidator(): GlobalStepProfileValidator {
  return new GlobalStepProfileValidator(
    [
      new GlobalStepProfileSequenceRangeRule(32, 64),
      new GlobalStepProfileRequiredCountryRule("global step profile needs this field"),
      new GlobalStepProfileGraceDaysRangeRule(16, 86400),
      new GlobalStepProfileCodePrefixRule("OPS"),
      new GlobalStepProfileAllowedCodeRule(["regional"]),
      new GlobalStepProfileCountryLengthRule(80),
    ],
  );
}
