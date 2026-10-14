import { RollingTierRollup } from "./rolling-tier-rollup.js";

/** A rule a rolling tier rollup must pass. Check returns its problems, or none. */
export interface RollingTierRollupRule {
  check(item: RollingTierRollup): string[];
}

export class RollingTierRollupMinimumRangeRule implements RollingTierRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTierRollup): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingTierRollupRequiredLocaleRule implements RollingTierRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingTierRollup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RollingTierRollupRequiredSummaryRule implements RollingTierRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingTierRollup): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class RollingTierRollupRequiredLabelRule implements RollingTierRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingTierRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingTierRollupCodeLengthRule implements RollingTierRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingTierRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingTierRollupCodePrefixRule implements RollingTierRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingTierRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling tier rollup. */
export class RollingTierRollupValidator {
  rules: RollingTierRollupRule[];

  constructor(rules: RollingTierRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RollingTierRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingTierRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingTierRollup[]): Map<string, string[]> {
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

export function defaultRollingTierRollupValidator(): RollingTierRollupValidator {
  return new RollingTierRollupValidator(
    [
      new RollingTierRollupMinimumRangeRule(1.2, 3123.8),
      new RollingTierRollupRequiredLocaleRule("rolling tier rollup needs a value"),
      new RollingTierRollupRequiredSummaryRule("rolling tier rollup needs a value"),
      new RollingTierRollupRequiredLabelRule("rolling tier rollup needs a value"),
      new RollingTierRollupCodeLengthRule(86400),
      new RollingTierRollupCodePrefixRule("X"),
    ],
  );
}
