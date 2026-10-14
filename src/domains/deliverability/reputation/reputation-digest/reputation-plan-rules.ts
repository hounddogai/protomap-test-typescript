import { ReputationPlan } from "./reputation-plan.js";

/** A rule a reputation plan must pass. Check returns its problems, or none. */
export interface ReputationPlanRule {
  check(item: ReputationPlan): string[];
}

export class ReputationPlanCountryLengthRule implements ReputationPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationPlan): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationPlanRequiredCodeRule implements ReputationPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationPlanCodeLengthRule implements ReputationPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationPlanRequiredCountryRule implements ReputationPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationPlan): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationPlanContactEmailLengthRule implements ReputationPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationPlan): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationPlanRequiredTitleRule implements ReputationPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation plan. */
export class ReputationPlanValidator {
  rules: ReputationPlanRule[];

  constructor(rules: ReputationPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationPlan[]): Map<string, string[]> {
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

export function defaultReputationPlanValidator(): ReputationPlanValidator {
  return new ReputationPlanValidator(
    [
      new ReputationPlanCountryLengthRule(16),
      new ReputationPlanRequiredCodeRule("reputation plan needs an entry"),
      new ReputationPlanCodeLengthRule(3600),
      new ReputationPlanRequiredCountryRule("reputation plan needs this field"),
      new ReputationPlanContactEmailLengthRule(80),
      new ReputationPlanRequiredTitleRule("reputation plan needs an entry"),
    ],
  );
}
