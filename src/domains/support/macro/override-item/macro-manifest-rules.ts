import * as text from "../../../../kit/text.js";
import { MacroManifest } from "./macro-manifest.js";

/** A rule a macro manifest must pass. Check returns its problems, or none. */
export interface MacroManifestRule {
  check(item: MacroManifest): string[];
}

export class MacroManifestCodePrefixRule implements MacroManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MacroManifestAllowedVariantRule implements MacroManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is too long`];
    return [];
  }
}

export class MacroManifestWindowDaysRangeRule implements MacroManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroManifest): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroManifestCodeLengthRule implements MacroManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroManifestCurrencyLengthRule implements MacroManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroManifest): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a macro manifest. */
export class MacroManifestValidator {
  rules: MacroManifestRule[];

  constructor(rules: MacroManifestRule[]) {
    this.rules = rules;
  }

  validate(item: MacroManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroManifest[]): Map<string, string[]> {
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

export function defaultMacroManifestValidator(): MacroManifestValidator {
  return new MacroManifestValidator(
    [
      new MacroManifestCodePrefixRule("Q"),
      new MacroManifestAllowedVariantRule(["seasonal"]),
      new MacroManifestWindowDaysRangeRule(120, 1000),
      new MacroManifestCodeLengthRule(64),
      new MacroManifestCurrencyLengthRule(16),
    ],
  );
}
