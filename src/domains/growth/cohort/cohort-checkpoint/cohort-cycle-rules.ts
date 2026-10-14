import { CohortCycle } from "./cohort-cycle.js";

/** A rule a cohort cycle must pass. Check returns its problems, or none. */
export interface CohortCycleRule {
  check(item: CohortCycle): string[];
}

export class CohortCycleRequiredNameRule implements CohortCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CohortCycleNameLengthRule implements CohortCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortCycleRequiredAudienceIdRule implements CohortCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortCycle): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort cycle. */
export class CohortCycleValidator {
  rules: CohortCycleRule[];

  constructor(rules: CohortCycleRule[]) {
    this.rules = rules;
  }

  validate(item: CohortCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortCycle[]): Map<string, string[]> {
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

export function defaultCohortCycleValidator(): CohortCycleValidator {
  return new CohortCycleValidator(
    [
      new CohortCycleRequiredNameRule("cohort cycle needs this field"),
      new CohortCycleNameLengthRule(1000),
      new CohortCycleRequiredAudienceIdRule("cohort cycle needs a value"),
    ],
  );
}
