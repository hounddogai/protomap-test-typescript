import * as text from "../../../../kit/text.js";
import { CreativeRollup } from "./creative-rollup.js";

/** A rule a creative rollup must pass. Check returns its problems, or none. */
export interface CreativeRollupRule {
  check(item: CreativeRollup): string[];
}

export class CreativeRollupDurationMinutesRangeRule implements CreativeRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeRollup): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeRollupCodePrefixRule implements CreativeRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeRollupLabelLengthRule implements CreativeRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeRollupAllowedCodeRule implements CreativeRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a creative rollup. */
export class CreativeRollupValidator {
  rules: CreativeRollupRule[];

  constructor(rules: CreativeRollupRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeRollup[]): Map<string, string[]> {
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

export function defaultCreativeRollupValidator(): CreativeRollupValidator {
  return new CreativeRollupValidator(
    [
      new CreativeRollupDurationMinutesRangeRule(80, 3600),
      new CreativeRollupCodePrefixRule("ACM"),
      new CreativeRollupLabelLengthRule(32),
      new CreativeRollupAllowedCodeRule(["fallback"]),
    ],
  );
}
