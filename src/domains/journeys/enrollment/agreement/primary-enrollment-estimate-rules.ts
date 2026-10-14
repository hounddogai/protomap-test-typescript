import { PrimaryEnrollmentEstimate } from "./primary-enrollment-estimate.js";

/** A rule a primary enrollment estimate must pass. Check returns its problems, or none. */
export interface PrimaryEnrollmentEstimateRule {
  check(item: PrimaryEnrollmentEstimate): string[];
}

export class PrimaryEnrollmentEstimateUnitLengthRule implements PrimaryEnrollmentEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryEnrollmentEstimate): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryEnrollmentEstimateCodePrefixRule implements PrimaryEnrollmentEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryEnrollmentEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryEnrollmentEstimateNameLengthRule implements PrimaryEnrollmentEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryEnrollmentEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary enrollment estimate. */
export class PrimaryEnrollmentEstimateValidator {
  rules: PrimaryEnrollmentEstimateRule[];

  constructor(rules: PrimaryEnrollmentEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryEnrollmentEstimate): string[] {
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

  requireValid(item: PrimaryEnrollmentEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryEnrollmentEstimate[]): Map<string, string[]> {
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

export function defaultPrimaryEnrollmentEstimateValidator(): PrimaryEnrollmentEstimateValidator {
  return new PrimaryEnrollmentEstimateValidator(
    [
      new PrimaryEnrollmentEstimateUnitLengthRule(3600),
      new PrimaryEnrollmentEstimateCodePrefixRule("OPS"),
      new PrimaryEnrollmentEstimateNameLengthRule(86400),
    ],
  );
}
