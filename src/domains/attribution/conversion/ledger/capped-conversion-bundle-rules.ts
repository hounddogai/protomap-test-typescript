import * as text from "../../../../kit/text.js";
import { CappedConversionBundle } from "./capped-conversion-bundle.js";

/** A rule a capped conversion bundle must pass. Check returns its problems, or none. */
export interface CappedConversionBundleRule {
  check(item: CappedConversionBundle): string[];
}

export class CappedConversionBundleCodePrefixRule implements CappedConversionBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedConversionBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedConversionBundleAllowedSummaryRule implements CappedConversionBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedConversionBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is blocked`];
    return [];
  }
}

export class CappedConversionBundleSummaryLengthRule implements CappedConversionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedConversionBundle): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedConversionBundleCodeLengthRule implements CappedConversionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedConversionBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedConversionBundleClicksRangeRule implements CappedConversionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedConversionBundle): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedConversionBundleRequiredLabelRule implements CappedConversionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedConversionBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped conversion bundle. */
export class CappedConversionBundleValidator {
  rules: CappedConversionBundleRule[];

  constructor(rules: CappedConversionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedConversionBundle): string[] {
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

  requireValid(item: CappedConversionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedConversionBundle[]): Map<string, string[]> {
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

export function defaultCappedConversionBundleValidator(): CappedConversionBundleValidator {
  return new CappedConversionBundleValidator(
    [
      new CappedConversionBundleCodePrefixRule("X"),
      new CappedConversionBundleAllowedSummaryRule([]),
      new CappedConversionBundleSummaryLengthRule(120),
      new CappedConversionBundleCodeLengthRule(3600),
      new CappedConversionBundleClicksRangeRule(16, 255),
      new CappedConversionBundleRequiredLabelRule("capped conversion bundle needs an entry"),
    ],
  );
}
