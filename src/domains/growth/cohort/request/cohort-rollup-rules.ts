import { CohortRollup } from "./cohort-rollup.js";

/** A rule a cohort rollup must pass. Check returns its problems, or none. */
export interface CohortRollupRule {
  check(item: CohortRollup): string[];
}

export class CohortRollupTitleLengthRule implements CohortRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortRollupRequiredCohortRule implements CohortRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortRollup): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class CohortRollupCohortLengthRule implements CohortRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortRollup): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortRollupCodePrefixRule implements CohortRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a cohort rollup. */
export class CohortRollupValidator {
  rules: CohortRollupRule[];

  constructor(rules: CohortRollupRule[]) {
    this.rules = rules;
  }

  validate(item: CohortRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortRollup[]): Map<string, string[]> {
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

export function defaultCohortRollupValidator(): CohortRollupValidator {
  return new CohortRollupValidator(
    [
      new CohortRollupTitleLengthRule(255),
      new CohortRollupRequiredCohortRule("cohort rollup needs this field"),
      new CohortRollupCohortLengthRule(3600),
      new CohortRollupCodePrefixRule("REF"),
    ],
  );
}
