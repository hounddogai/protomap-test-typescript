import * as text from "../../../../kit/text.js";
import { ProofDraft } from "./proof-draft.js";

/** A rule a proof draft must pass. Check returns its problems, or none. */
export interface ProofDraftRule {
  check(item: ProofDraft): string[];
}

export class ProofDraftRateRangeRule implements ProofDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofDraft): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofDraftAllowedNameRule implements ProofDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ProofDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class ProofDraftUnitLengthRule implements ProofDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofDraft): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofDraftRequiredUnitRule implements ProofDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofDraft): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ProofDraftThresholdRangeRule implements ProofDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofDraft): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofDraftRequiredSourceRule implements ProofDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofDraft): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof draft. */
export class ProofDraftValidator {
  rules: ProofDraftRule[];

  constructor(rules: ProofDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ProofDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofDraft[]): Map<string, string[]> {
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

export function defaultProofDraftValidator(): ProofDraftValidator {
  return new ProofDraftValidator(
    [
      new ProofDraftRateRangeRule(3.1, 4963.2),
      new ProofDraftAllowedNameRule([]),
      new ProofDraftUnitLengthRule(16),
      new ProofDraftRequiredUnitRule("proof draft needs a value"),
      new ProofDraftThresholdRangeRule(1, 696.9),
      new ProofDraftRequiredSourceRule("proof draft needs this field"),
    ],
  );
}
