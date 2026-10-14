import * as text from "../../../../kit/text.js";
import { DefaultInsightProfile } from "./default-insight-profile.js";

/** A rule a default insight profile must pass. Check returns its problems, or none. */
export interface DefaultInsightProfileRule {
  check(item: DefaultInsightProfile): string[];
}

export class DefaultInsightProfileMinimumRangeRule implements DefaultInsightProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultInsightProfile): string[] {
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

export class DefaultInsightProfileAllowedCodeRule implements DefaultInsightProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultInsightProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class DefaultInsightProfileCodePrefixRule implements DefaultInsightProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultInsightProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultInsightProfileUnitLengthRule implements DefaultInsightProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInsightProfile): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default insight profile. */
export class DefaultInsightProfileValidator {
  rules: DefaultInsightProfileRule[];

  constructor(rules: DefaultInsightProfileRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultInsightProfile): string[] {
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

  requireValid(item: DefaultInsightProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultInsightProfile[]): Map<string, string[]> {
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

export function defaultDefaultInsightProfileValidator(): DefaultInsightProfileValidator {
  return new DefaultInsightProfileValidator(
    [
      new DefaultInsightProfileMinimumRangeRule(2.1, 3294.1),
      new DefaultInsightProfileAllowedCodeRule([]),
      new DefaultInsightProfileCodePrefixRule("X"),
      new DefaultInsightProfileUnitLengthRule(86400),
    ],
  );
}
