import * as text from "../../../../kit/text.js";
import { FallbackFrequencyCycle } from "./fallback-frequency-cycle.js";

/** A rule a fallback frequency cycle must pass. Check returns its problems, or none. */
export interface FallbackFrequencyCycleRule {
  check(item: FallbackFrequencyCycle): string[];
}

export class FallbackFrequencyCycleAllowedCodeRule implements FallbackFrequencyCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackFrequencyCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class FallbackFrequencyCycleRequiredCodeRule implements FallbackFrequencyCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFrequencyCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFrequencyCycleLimitRangeRule implements FallbackFrequencyCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFrequencyCycle): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackFrequencyCycleEndsAtRangeRule implements FallbackFrequencyCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFrequencyCycle): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackFrequencyCycleRequiredLabelRule implements FallbackFrequencyCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFrequencyCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFrequencyCycleCodePrefixRule implements FallbackFrequencyCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackFrequencyCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback frequency cycle. */
export class FallbackFrequencyCycleValidator {
  rules: FallbackFrequencyCycleRule[];

  constructor(rules: FallbackFrequencyCycleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFrequencyCycle): string[] {
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

  requireValid(item: FallbackFrequencyCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFrequencyCycle[]): Map<string, string[]> {
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

export function defaultFallbackFrequencyCycleValidator(): FallbackFrequencyCycleValidator {
  return new FallbackFrequencyCycleValidator(
    [
      new FallbackFrequencyCycleAllowedCodeRule(["rolling"]),
      new FallbackFrequencyCycleRequiredCodeRule("fallback frequency cycle needs an entry"),
      new FallbackFrequencyCycleLimitRangeRule(32, 120),
      new FallbackFrequencyCycleEndsAtRangeRule(16, 120),
      new FallbackFrequencyCycleRequiredLabelRule("fallback frequency cycle needs this field"),
      new FallbackFrequencyCycleCodePrefixRule("X"),
    ],
  );
}
