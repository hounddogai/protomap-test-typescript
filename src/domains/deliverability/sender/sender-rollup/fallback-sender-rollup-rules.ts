import { FallbackSenderRollup } from "./fallback-sender-rollup.js";

/** A rule a fallback sender rollup must pass. Check returns its problems, or none. */
export interface FallbackSenderRollupRule {
  check(item: FallbackSenderRollup): string[];
}

export class FallbackSenderRollupFrequencyCapRangeRule implements FallbackSenderRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSenderRollup): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackSenderRollupRequiredSegmentRule implements FallbackSenderRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSenderRollup): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSenderRollupLabelLengthRule implements FallbackSenderRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSenderRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSenderRollupRequiredCodeRule implements FallbackSenderRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSenderRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback sender rollup. */
export class FallbackSenderRollupValidator {
  rules: FallbackSenderRollupRule[];

  constructor(rules: FallbackSenderRollupRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSenderRollup): string[] {
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

  requireValid(item: FallbackSenderRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSenderRollup[]): Map<string, string[]> {
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

export function defaultFallbackSenderRollupValidator(): FallbackSenderRollupValidator {
  return new FallbackSenderRollupValidator(
    [
      new FallbackSenderRollupFrequencyCapRangeRule(16, 120),
      new FallbackSenderRollupRequiredSegmentRule("fallback sender rollup needs an entry"),
      new FallbackSenderRollupLabelLengthRule(120),
      new FallbackSenderRollupRequiredCodeRule("fallback sender rollup needs a value"),
    ],
  );
}
