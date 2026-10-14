import { PendingProofMapping } from "./pending-proof-mapping.js";

/** A rule a pending proof mapping must pass. Check returns its problems, or none. */
export interface PendingProofMappingRule {
  check(item: PendingProofMapping): string[];
}

export class PendingProofMappingRequiredCountryRule implements PendingProofMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingProofMapping): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PendingProofMappingLabelLengthRule implements PendingProofMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingProofMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingProofMappingScoreRangeRule implements PendingProofMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingProofMapping): string[] {
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

/** Runs every rule of a pending proof mapping. */
export class PendingProofMappingValidator {
  rules: PendingProofMappingRule[];

  constructor(rules: PendingProofMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PendingProofMapping): string[] {
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

  requireValid(item: PendingProofMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingProofMapping[]): Map<string, string[]> {
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

export function defaultPendingProofMappingValidator(): PendingProofMappingValidator {
  return new PendingProofMappingValidator(
    [
      new PendingProofMappingRequiredCountryRule("pending proof mapping needs a value"),
      new PendingProofMappingLabelLengthRule(3600),
      new PendingProofMappingScoreRangeRule(1, 1531.7),
    ],
  );
}
