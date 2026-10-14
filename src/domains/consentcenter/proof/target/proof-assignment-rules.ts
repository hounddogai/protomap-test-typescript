import { ProofAssignment } from "./proof-assignment.js";

/** A rule a proof assignment must pass. Check returns its problems, or none. */
export interface ProofAssignmentRule {
  check(item: ProofAssignment): string[];
}

export class ProofAssignmentLocaleLengthRule implements ProofAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAssignment): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAssignmentImpressionsRangeRule implements ProofAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofAssignment): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofAssignmentCodeLengthRule implements ProofAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAssignmentBudgetRangeRule implements ProofAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofAssignment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofAssignmentTitleLengthRule implements ProofAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAssignmentRequiredTitleRule implements ProofAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof assignment. */
export class ProofAssignmentValidator {
  rules: ProofAssignmentRule[];

  constructor(rules: ProofAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ProofAssignment): string[] {
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

  requireValid(item: ProofAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofAssignment[]): Map<string, string[]> {
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

export function defaultProofAssignmentValidator(): ProofAssignmentValidator {
  return new ProofAssignmentValidator(
    [
      new ProofAssignmentLocaleLengthRule(1000),
      new ProofAssignmentImpressionsRangeRule(16, 1000),
      new ProofAssignmentCodeLengthRule(32),
      new ProofAssignmentBudgetRangeRule(4.2, 2254.3),
      new ProofAssignmentTitleLengthRule(86400),
      new ProofAssignmentRequiredTitleRule("proof assignment needs a value"),
    ],
  );
}
