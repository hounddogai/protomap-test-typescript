import { EnrollmentProfile } from "./enrollment-profile.js";

/** A rule a enrollment profile must pass. Check returns its problems, or none. */
export interface EnrollmentProfileRule {
  check(item: EnrollmentProfile): string[];
}

export class EnrollmentProfileClicksRangeRule implements EnrollmentProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentProfile): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentProfileRequiredCountryRule implements EnrollmentProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentProfile): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentProfileUpdatedAtRangeRule implements EnrollmentProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentProfile): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentProfileRequiredCodeRule implements EnrollmentProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a enrollment profile. */
export class EnrollmentProfileValidator {
  rules: EnrollmentProfileRule[];

  constructor(rules: EnrollmentProfileRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentProfile[]): Map<string, string[]> {
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

export function defaultEnrollmentProfileValidator(): EnrollmentProfileValidator {
  return new EnrollmentProfileValidator(
    [
      new EnrollmentProfileClicksRangeRule(86400, 86400),
      new EnrollmentProfileRequiredCountryRule("enrollment profile needs this field"),
      new EnrollmentProfileUpdatedAtRangeRule(1000, 3600),
      new EnrollmentProfileRequiredCodeRule("enrollment profile needs an entry"),
    ],
  );
}
