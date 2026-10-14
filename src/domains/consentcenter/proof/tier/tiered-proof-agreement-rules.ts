import * as text from "../../../../kit/text.js";
import { TieredProofAgreement } from "./tiered-proof-agreement.js";

/** A rule a tiered proof agreement must pass. Check returns its problems, or none. */
export interface TieredProofAgreementRule {
  check(item: TieredProofAgreement): string[];
}

export class TieredProofAgreementSummaryLengthRule implements TieredProofAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredProofAgreement): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredProofAgreementSequenceRangeRule implements TieredProofAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredProofAgreement): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredProofAgreementRequiredCodeRule implements TieredProofAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredProofAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredProofAgreementRequiredSummaryRule implements TieredProofAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredProofAgreement): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class TieredProofAgreementCodeLengthRule implements TieredProofAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredProofAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredProofAgreementAllowedCodeRule implements TieredProofAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredProofAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a tiered proof agreement. */
export class TieredProofAgreementValidator {
  rules: TieredProofAgreementRule[];

  constructor(rules: TieredProofAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: TieredProofAgreement): string[] {
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

  requireValid(item: TieredProofAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredProofAgreement[]): Map<string, string[]> {
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

export function defaultTieredProofAgreementValidator(): TieredProofAgreementValidator {
  return new TieredProofAgreementValidator(
    [
      new TieredProofAgreementSummaryLengthRule(3600),
      new TieredProofAgreementSequenceRangeRule(16, 86400),
      new TieredProofAgreementRequiredCodeRule("tiered proof agreement needs this field"),
      new TieredProofAgreementRequiredSummaryRule("tiered proof agreement needs a value"),
      new TieredProofAgreementCodeLengthRule(16),
      new TieredProofAgreementAllowedCodeRule(["primary", "global", "default"]),
    ],
  );
}
