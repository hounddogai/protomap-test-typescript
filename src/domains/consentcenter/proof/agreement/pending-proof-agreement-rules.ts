import { PendingProofAgreement } from "./pending-proof-agreement.js";

/** A rule a pending proof agreement must pass. Check returns its problems, or none. */
export interface PendingProofAgreementRule {
  check(item: PendingProofAgreement): string[];
}

export class PendingProofAgreementCodeLengthRule implements PendingProofAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingProofAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingProofAgreementNameLengthRule implements PendingProofAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingProofAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingProofAgreementCodePrefixRule implements PendingProofAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingProofAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending proof agreement. */
export class PendingProofAgreementValidator {
  rules: PendingProofAgreementRule[];

  constructor(rules: PendingProofAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PendingProofAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingProofAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingProofAgreement[]): Map<string, string[]> {
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

export function defaultPendingProofAgreementValidator(): PendingProofAgreementValidator {
  return new PendingProofAgreementValidator(
    [
      new PendingProofAgreementCodeLengthRule(255),
      new PendingProofAgreementNameLengthRule(80),
      new PendingProofAgreementCodePrefixRule("X"),
    ],
  );
}
