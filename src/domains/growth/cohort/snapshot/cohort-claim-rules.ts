import { CohortClaim } from "./cohort-claim.js";

/** A rule a cohort claim must pass. Check returns its problems, or none. */
export interface CohortClaimRule {
  check(item: CohortClaim): string[];
}

export class CohortClaimRequiredVariantRule implements CohortClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortClaim): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class CohortClaimRequiredTitleRule implements CohortClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CohortClaimRequiredCodeRule implements CohortClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort claim. */
export class CohortClaimValidator {
  rules: CohortClaimRule[];

  constructor(rules: CohortClaimRule[]) {
    this.rules = rules;
  }

  validate(item: CohortClaim): string[] {
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

  requireValid(item: CohortClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortClaim[]): Map<string, string[]> {
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

export function defaultCohortClaimValidator(): CohortClaimValidator {
  return new CohortClaimValidator(
    [
      new CohortClaimRequiredVariantRule("cohort claim needs a value"),
      new CohortClaimRequiredTitleRule("cohort claim needs this field"),
      new CohortClaimRequiredCodeRule("cohort claim needs an entry"),
    ],
  );
}
