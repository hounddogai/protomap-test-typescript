import { LenientPreferenceRollup } from "./lenient-preference-rollup.js";

/** A rule a lenient preference rollup must pass. Check returns its problems, or none. */
export interface LenientPreferenceRollupRule {
  check(item: LenientPreferenceRollup): string[];
}

export class LenientPreferenceRollupMaximumRangeRule implements LenientPreferenceRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPreferenceRollup): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPreferenceRollupCodePrefixRule implements LenientPreferenceRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPreferenceRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientPreferenceRollupScoreRangeRule implements LenientPreferenceRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPreferenceRollup): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientPreferenceRollupChannelLengthRule implements LenientPreferenceRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPreferenceRollup): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPreferenceRollupRequiredJourneyIdRule implements LenientPreferenceRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPreferenceRollup): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPreferenceRollupNameLengthRule implements LenientPreferenceRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPreferenceRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient preference rollup. */
export class LenientPreferenceRollupValidator {
  rules: LenientPreferenceRollupRule[];

  constructor(rules: LenientPreferenceRollupRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPreferenceRollup): string[] {
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

  requireValid(item: LenientPreferenceRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPreferenceRollup[]): Map<string, string[]> {
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

export function defaultLenientPreferenceRollupValidator(): LenientPreferenceRollupValidator {
  return new LenientPreferenceRollupValidator(
    [
      new LenientPreferenceRollupMaximumRangeRule(1.1, 2663.8),
      new LenientPreferenceRollupCodePrefixRule("REF"),
      new LenientPreferenceRollupScoreRangeRule(8.1, 2685.5),
      new LenientPreferenceRollupChannelLengthRule(120),
      new LenientPreferenceRollupRequiredJourneyIdRule("lenient preference rollup needs a value"),
      new LenientPreferenceRollupNameLengthRule(86400),
    ],
  );
}
