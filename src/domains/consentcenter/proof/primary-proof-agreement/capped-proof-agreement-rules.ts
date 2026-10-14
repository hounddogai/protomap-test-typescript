import { CappedProofAgreement } from "./capped-proof-agreement.js";

/** A rule a capped proof agreement must pass. Check returns its problems, or none. */
export interface CappedProofAgreementRule {
  check(item: CappedProofAgreement): string[];
}

export class CappedProofAgreementRequiredNameRule implements CappedProofAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedProofAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedProofAgreementDescriptionLengthRule implements CappedProofAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedProofAgreement): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedProofAgreementSourceLengthRule implements CappedProofAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedProofAgreement): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped proof agreement. */
export class CappedProofAgreementValidator {
  rules: CappedProofAgreementRule[];

  constructor(rules: CappedProofAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: CappedProofAgreement): string[] {
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

  requireValid(item: CappedProofAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedProofAgreement[]): Map<string, string[]> {
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

export function defaultCappedProofAgreementValidator(): CappedProofAgreementValidator {
  return new CappedProofAgreementValidator(
    [
      new CappedProofAgreementRequiredNameRule("capped proof agreement needs an entry"),
      new CappedProofAgreementDescriptionLengthRule(3600),
      new CappedProofAgreementSourceLengthRule(86400),
    ],
  );
}
