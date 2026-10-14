import * as text from "../../../../kit/text.js";
import { LegacyWaitRollup } from "./legacy-wait-rollup.js";

/** A rule a legacy wait rollup must pass. Check returns its problems, or none. */
export interface LegacyWaitRollupRule {
  check(item: LegacyWaitRollup): string[];
}

export class LegacyWaitRollupWindowDaysRangeRule implements LegacyWaitRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWaitRollup): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyWaitRollupPhoneLengthRule implements LegacyWaitRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWaitRollup): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWaitRollupAllowedCodeRule implements LegacyWaitRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyWaitRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class LegacyWaitRollupCodePrefixRule implements LegacyWaitRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyWaitRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyWaitRollupRegionLengthRule implements LegacyWaitRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWaitRollup): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWaitRollupRequiredCodeRule implements LegacyWaitRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWaitRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy wait rollup. */
export class LegacyWaitRollupValidator {
  rules: LegacyWaitRollupRule[];

  constructor(rules: LegacyWaitRollupRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWaitRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyWaitRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWaitRollup[]): Map<string, string[]> {
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

export function defaultLegacyWaitRollupValidator(): LegacyWaitRollupValidator {
  return new LegacyWaitRollupValidator(
    [
      new LegacyWaitRollupWindowDaysRangeRule(32, 3600),
      new LegacyWaitRollupPhoneLengthRule(120),
      new LegacyWaitRollupAllowedCodeRule(["manual", "global", "strict"]),
      new LegacyWaitRollupCodePrefixRule("Q"),
      new LegacyWaitRollupRegionLengthRule(32),
      new LegacyWaitRollupRequiredCodeRule("legacy wait rollup needs an entry"),
    ],
  );
}
