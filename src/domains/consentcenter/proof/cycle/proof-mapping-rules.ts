import { ProofMapping } from "./proof-mapping.js";

/** A rule a proof mapping must pass. Check returns its problems, or none. */
export interface ProofMappingRule {
  check(item: ProofMapping): string[];
}

export class ProofMappingCodeLengthRule implements ProofMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofMappingThresholdRangeRule implements ProofMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofMapping): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofMappingOpenRateRangeRule implements ProofMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofMapping): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofMappingRatioRangeRule implements ProofMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofMapping): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofMappingSegmentLengthRule implements ProofMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofMapping): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofMappingRequiredLabelRule implements ProofMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof mapping. */
export class ProofMappingValidator {
  rules: ProofMappingRule[];

  constructor(rules: ProofMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ProofMapping): string[] {
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

  requireValid(item: ProofMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofMapping[]): Map<string, string[]> {
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

export function defaultProofMappingValidator(): ProofMappingValidator {
  return new ProofMappingValidator(
    [
      new ProofMappingCodeLengthRule(255),
      new ProofMappingThresholdRangeRule(9.5, 3859.7),
      new ProofMappingOpenRateRangeRule(8.4, 2071.7),
      new ProofMappingRatioRangeRule(8.4, 4524),
      new ProofMappingSegmentLengthRule(3600),
      new ProofMappingRequiredLabelRule("proof mapping needs this field"),
    ],
  );
}
