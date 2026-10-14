import { LegacyDoubleOptInRollup } from "./legacy-double-opt-in-rollup.js";

/** A rule a legacy double opt in rollup must pass. Check returns its problems, or none. */
export interface LegacyDoubleOptInRollupRule {
  check(item: LegacyDoubleOptInRollup): string[];
}

export class LegacyDoubleOptInRollupRequiredPhoneRule implements LegacyDoubleOptInRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDoubleOptInRollup): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDoubleOptInRollupChannelLengthRule implements LegacyDoubleOptInRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInRollup): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDoubleOptInRollupAmountRangeRule implements LegacyDoubleOptInRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDoubleOptInRollup): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyDoubleOptInRollupNameLengthRule implements LegacyDoubleOptInRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDoubleOptInRollupCodeLengthRule implements LegacyDoubleOptInRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDoubleOptInRollupCodePrefixRule implements LegacyDoubleOptInRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyDoubleOptInRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy double opt in rollup. */
export class LegacyDoubleOptInRollupValidator {
  rules: LegacyDoubleOptInRollupRule[];

  constructor(rules: LegacyDoubleOptInRollupRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDoubleOptInRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyDoubleOptInRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDoubleOptInRollup[]): Map<string, string[]> {
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

export function defaultLegacyDoubleOptInRollupValidator(): LegacyDoubleOptInRollupValidator {
  return new LegacyDoubleOptInRollupValidator(
    [
      new LegacyDoubleOptInRollupRequiredPhoneRule("legacy double opt in rollup needs this field"),
      new LegacyDoubleOptInRollupChannelLengthRule(80),
      new LegacyDoubleOptInRollupAmountRangeRule(5.2, 3008.5),
      new LegacyDoubleOptInRollupNameLengthRule(3600),
      new LegacyDoubleOptInRollupCodeLengthRule(1000),
      new LegacyDoubleOptInRollupCodePrefixRule("Q"),
    ],
  );
}
