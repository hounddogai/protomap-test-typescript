import { EnrollmentPlan } from "./enrollment-plan.js";

/** A rule a enrollment plan must pass. Check returns its problems, or none. */
export interface EnrollmentPlanRule {
  check(item: EnrollmentPlan): string[];
}

export class EnrollmentPlanTitleLengthRule implements EnrollmentPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentPlanNameLengthRule implements EnrollmentPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentPlanRequiredNameRule implements EnrollmentPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentPlanPinnedGuardRule implements EnrollmentPlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EnrollmentPlan): string[] {
    if (item.pinned && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class EnrollmentPlanCodePrefixRule implements EnrollmentPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentPlanReviewerLengthRule implements EnrollmentPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentPlan): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment plan. */
export class EnrollmentPlanValidator {
  rules: EnrollmentPlanRule[];

  constructor(rules: EnrollmentPlanRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentPlan): string[] {
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

  requireValid(item: EnrollmentPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentPlan[]): Map<string, string[]> {
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

export function defaultEnrollmentPlanValidator(): EnrollmentPlanValidator {
  return new EnrollmentPlanValidator(
    [
      new EnrollmentPlanTitleLengthRule(1000),
      new EnrollmentPlanNameLengthRule(86400),
      new EnrollmentPlanRequiredNameRule("enrollment plan needs an entry"),
      new EnrollmentPlanPinnedGuardRule(2),
      new EnrollmentPlanCodePrefixRule("Q"),
      new EnrollmentPlanReviewerLengthRule(64),
    ],
  );
}
