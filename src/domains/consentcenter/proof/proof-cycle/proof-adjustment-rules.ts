import { ProofAdjustment } from "./proof-adjustment.js";

/** A rule a proof adjustment must pass. Check returns its problems, or none. */
export interface ProofAdjustmentRule {
  check(item: ProofAdjustment): string[];
}

export class ProofAdjustmentTitleLengthRule implements ProofAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAdjustmentScoreRangeRule implements ProofAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofAdjustment): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofAdjustmentCodeLengthRule implements ProofAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAdjustmentRequiredTitleRule implements ProofAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ProofAdjustmentCodePrefixRule implements ProofAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofAdjustmentAttemptsRangeRule implements ProofAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofAdjustment): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a proof adjustment. */
export class ProofAdjustmentValidator {
  rules: ProofAdjustmentRule[];

  constructor(rules: ProofAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ProofAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofAdjustment[]): Map<string, string[]> {
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

export function defaultProofAdjustmentValidator(): ProofAdjustmentValidator {
  return new ProofAdjustmentValidator(
    [
      new ProofAdjustmentTitleLengthRule(80),
      new ProofAdjustmentScoreRangeRule(4.6, 818.8),
      new ProofAdjustmentCodeLengthRule(3600),
      new ProofAdjustmentRequiredTitleRule("proof adjustment needs this field"),
      new ProofAdjustmentCodePrefixRule("X"),
      new ProofAdjustmentAttemptsRangeRule(1000, 86400),
    ],
  );
}
