import { EnrollmentEstimate } from "./enrollment-estimate.js";

/** A rule a enrollment estimate must pass. Check returns its problems, or none. */
export interface EnrollmentEstimateRule {
  check(item: EnrollmentEstimate): string[];
}

export class EnrollmentEstimateArchivedGuardRule implements EnrollmentEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EnrollmentEstimate): string[] {
    if (item.archived && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class EnrollmentEstimateRequiredLabelRule implements EnrollmentEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentEstimateCodePrefixRule implements EnrollmentEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentEstimateRequiredCohortRule implements EnrollmentEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentEstimate): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentEstimateAttemptsRangeRule implements EnrollmentEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentEstimate): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a enrollment estimate. */
export class EnrollmentEstimateValidator {
  rules: EnrollmentEstimateRule[];

  constructor(rules: EnrollmentEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentEstimate[]): Map<string, string[]> {
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

export function defaultEnrollmentEstimateValidator(): EnrollmentEstimateValidator {
  return new EnrollmentEstimateValidator(
    [
      new EnrollmentEstimateArchivedGuardRule(86400),
      new EnrollmentEstimateRequiredLabelRule("enrollment estimate needs this field"),
      new EnrollmentEstimateCodePrefixRule("OPS"),
      new EnrollmentEstimateRequiredCohortRule("enrollment estimate needs an entry"),
      new EnrollmentEstimateAttemptsRangeRule(255, 255),
    ],
  );
}
