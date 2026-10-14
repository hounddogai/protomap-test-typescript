import { GlobalFraudCheckClaim } from "./global-fraud-check-claim.js";

/** A rule a global fraud check claim must pass. Check returns its problems, or none. */
export interface GlobalFraudCheckClaimRule {
  check(item: GlobalFraudCheckClaim): string[];
}

export class GlobalFraudCheckClaimNotesLengthRule implements GlobalFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFraudCheckClaim): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFraudCheckClaimRequiredNotesRule implements GlobalFraudCheckClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFraudCheckClaim): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFraudCheckClaimTitleLengthRule implements GlobalFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFraudCheckClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global fraud check claim. */
export class GlobalFraudCheckClaimValidator {
  rules: GlobalFraudCheckClaimRule[];

  constructor(rules: GlobalFraudCheckClaimRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFraudCheckClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalFraudCheckClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFraudCheckClaim[]): Map<string, string[]> {
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

export function defaultGlobalFraudCheckClaimValidator(): GlobalFraudCheckClaimValidator {
  return new GlobalFraudCheckClaimValidator(
    [
      new GlobalFraudCheckClaimNotesLengthRule(80),
      new GlobalFraudCheckClaimRequiredNotesRule("global fraud check claim needs a value"),
      new GlobalFraudCheckClaimTitleLengthRule(120),
    ],
  );
}
