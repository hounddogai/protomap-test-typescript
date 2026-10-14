import { RollingComplaintVariance } from "./rolling-complaint-variance.js";

/** A rule a rolling complaint variance must pass. Check returns its problems, or none. */
export interface RollingComplaintVarianceRule {
  check(item: RollingComplaintVariance): string[];
}

export class RollingComplaintVarianceRequiredExternalRefRule implements RollingComplaintVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingComplaintVariance): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingComplaintVarianceExternalRefLengthRule implements RollingComplaintVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingComplaintVariance): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingComplaintVarianceNameLengthRule implements RollingComplaintVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingComplaintVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling complaint variance. */
export class RollingComplaintVarianceValidator {
  rules: RollingComplaintVarianceRule[];

  constructor(rules: RollingComplaintVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingComplaintVariance): string[] {
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

  requireValid(item: RollingComplaintVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingComplaintVariance[]): Map<string, string[]> {
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

export function defaultRollingComplaintVarianceValidator(): RollingComplaintVarianceValidator {
  return new RollingComplaintVarianceValidator(
    [
      new RollingComplaintVarianceRequiredExternalRefRule("rolling complaint variance needs a value"),
      new RollingComplaintVarianceExternalRefLengthRule(32),
      new RollingComplaintVarianceNameLengthRule(16),
    ],
  );
}
