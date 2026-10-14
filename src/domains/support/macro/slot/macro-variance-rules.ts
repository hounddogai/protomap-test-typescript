import { MacroVariance } from "./macro-variance.js";

/** A rule a macro variance must pass. Check returns its problems, or none. */
export interface MacroVarianceRule {
  check(item: MacroVariance): string[];
}

export class MacroVarianceThresholdRangeRule implements MacroVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroVariance): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroVarianceLabelLengthRule implements MacroVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroVarianceRequiredChannelRule implements MacroVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroVariance): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class MacroVarianceCodePrefixRule implements MacroVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MacroVarianceChannelLengthRule implements MacroVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroVariance): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a macro variance. */
export class MacroVarianceValidator {
  rules: MacroVarianceRule[];

  constructor(rules: MacroVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: MacroVariance): string[] {
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

  requireValid(item: MacroVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroVariance[]): Map<string, string[]> {
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

export function defaultMacroVarianceValidator(): MacroVarianceValidator {
  return new MacroVarianceValidator(
    [
      new MacroVarianceThresholdRangeRule(8.3, 3570.3),
      new MacroVarianceLabelLengthRule(86400),
      new MacroVarianceRequiredChannelRule("macro variance needs this field"),
      new MacroVarianceCodePrefixRule("X"),
      new MacroVarianceChannelLengthRule(3600),
    ],
  );
}
