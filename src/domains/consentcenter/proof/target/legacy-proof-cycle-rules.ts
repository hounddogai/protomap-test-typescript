import { LegacyProofCycle } from "./legacy-proof-cycle.js";

/** A rule a legacy proof cycle must pass. Check returns its problems, or none. */
export interface LegacyProofCycleRule {
  check(item: LegacyProofCycle): string[];
}

export class LegacyProofCycleRequiredContactEmailRule implements LegacyProofCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyProofCycle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyProofCycleCodePrefixRule implements LegacyProofCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyProofCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyProofCycleCodeLengthRule implements LegacyProofCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyProofCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyProofCycleLabelLengthRule implements LegacyProofCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyProofCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyProofCycleMaximumRangeRule implements LegacyProofCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyProofCycle): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyProofCycleRequiredLabelRule implements LegacyProofCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyProofCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy proof cycle. */
export class LegacyProofCycleValidator {
  rules: LegacyProofCycleRule[];

  constructor(rules: LegacyProofCycleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyProofCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyProofCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyProofCycle[]): Map<string, string[]> {
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

export function defaultLegacyProofCycleValidator(): LegacyProofCycleValidator {
  return new LegacyProofCycleValidator(
    [
      new LegacyProofCycleRequiredContactEmailRule("legacy proof cycle needs this field"),
      new LegacyProofCycleCodePrefixRule("X"),
      new LegacyProofCycleCodeLengthRule(1000),
      new LegacyProofCycleLabelLengthRule(120),
      new LegacyProofCycleMaximumRangeRule(0.9, 2536),
      new LegacyProofCycleRequiredLabelRule("legacy proof cycle needs this field"),
    ],
  );
}
