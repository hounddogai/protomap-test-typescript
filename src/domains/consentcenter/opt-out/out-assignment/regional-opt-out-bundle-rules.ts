import * as text from "../../../../kit/text.js";
import { RegionalOptOutBundle } from "./regional-opt-out-bundle.js";

/** A rule a regional opt out bundle must pass. Check returns its problems, or none. */
export interface RegionalOptOutBundleRule {
  check(item: RegionalOptOutBundle): string[];
}

export class RegionalOptOutBundleAllowedCodeRule implements RegionalOptOutBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalOptOutBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class RegionalOptOutBundleRequiredCodeRule implements RegionalOptOutBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalOptOutBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalOptOutBundleCodePrefixRule implements RegionalOptOutBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalOptOutBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalOptOutBundleUnitLengthRule implements RegionalOptOutBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalOptOutBundle): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalOptOutBundleMinimumRangeRule implements RegionalOptOutBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalOptOutBundle): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalOptOutBundleLocaleLengthRule implements RegionalOptOutBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalOptOutBundle): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional opt out bundle. */
export class RegionalOptOutBundleValidator {
  rules: RegionalOptOutBundleRule[];

  constructor(rules: RegionalOptOutBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalOptOutBundle): string[] {
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

  requireValid(item: RegionalOptOutBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalOptOutBundle[]): Map<string, string[]> {
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

export function defaultRegionalOptOutBundleValidator(): RegionalOptOutBundleValidator {
  return new RegionalOptOutBundleValidator(
    [
      new RegionalOptOutBundleAllowedCodeRule([]),
      new RegionalOptOutBundleRequiredCodeRule("regional opt out bundle needs a value"),
      new RegionalOptOutBundleCodePrefixRule("OPS"),
      new RegionalOptOutBundleUnitLengthRule(255),
      new RegionalOptOutBundleMinimumRangeRule(3.4, 2167.4),
      new RegionalOptOutBundleLocaleLengthRule(64),
    ],
  );
}
