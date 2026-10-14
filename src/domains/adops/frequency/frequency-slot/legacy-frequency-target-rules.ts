import { LegacyFrequencyTarget } from "./legacy-frequency-target.js";

/** A rule a legacy frequency target must pass. Check returns its problems, or none. */
export interface LegacyFrequencyTargetRule {
  check(item: LegacyFrequencyTarget): string[];
}

export class LegacyFrequencyTargetCodeLengthRule implements LegacyFrequencyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFrequencyTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFrequencyTargetNameLengthRule implements LegacyFrequencyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFrequencyTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFrequencyTargetRequiredCodeRule implements LegacyFrequencyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFrequencyTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFrequencyTargetOpenRateRangeRule implements LegacyFrequencyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFrequencyTarget): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyFrequencyTargetSourceLengthRule implements LegacyFrequencyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFrequencyTarget): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFrequencyTargetEndsAtRangeRule implements LegacyFrequencyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFrequencyTarget): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy frequency target. */
export class LegacyFrequencyTargetValidator {
  rules: LegacyFrequencyTargetRule[];

  constructor(rules: LegacyFrequencyTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFrequencyTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyFrequencyTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFrequencyTarget[]): Map<string, string[]> {
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

export function defaultLegacyFrequencyTargetValidator(): LegacyFrequencyTargetValidator {
  return new LegacyFrequencyTargetValidator(
    [
      new LegacyFrequencyTargetCodeLengthRule(120),
      new LegacyFrequencyTargetNameLengthRule(80),
      new LegacyFrequencyTargetRequiredCodeRule("legacy frequency target needs this field"),
      new LegacyFrequencyTargetOpenRateRangeRule(1.5, 3492.7),
      new LegacyFrequencyTargetSourceLengthRule(86400),
      new LegacyFrequencyTargetEndsAtRangeRule(16, 32),
    ],
  );
}
