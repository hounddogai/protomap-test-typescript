import * as text from "../../../../kit/text.js";
import { ProofAgreement } from "./proof-agreement.js";

/** A rule a proof agreement must pass. Check returns its problems, or none. */
export interface ProofAgreementRule {
  check(item: ProofAgreement): string[];
}

export class ProofAgreementChannelLengthRule implements ProofAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAgreement): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAgreementBidRangeRule implements ProofAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofAgreement): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofAgreementAllowedChecksumRule implements ProofAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ProofAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is out of range`];
    return [];
  }
}

export class ProofAgreementRequiredCodeRule implements ProofAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof agreement. */
export class ProofAgreementValidator {
  rules: ProofAgreementRule[];

  constructor(rules: ProofAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ProofAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofAgreement[]): Map<string, string[]> {
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

export function defaultProofAgreementValidator(): ProofAgreementValidator {
  return new ProofAgreementValidator(
    [
      new ProofAgreementChannelLengthRule(86400),
      new ProofAgreementBidRangeRule(6.1, 752),
      new ProofAgreementAllowedChecksumRule(["capped"]),
      new ProofAgreementRequiredCodeRule("proof agreement needs a value"),
    ],
  );
}
