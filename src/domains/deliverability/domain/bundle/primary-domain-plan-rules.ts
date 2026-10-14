import { PrimaryDomainPlan } from "./primary-domain-plan.js";

/** A rule a primary domain plan must pass. Check returns its problems, or none. */
export interface PrimaryDomainPlanRule {
  check(item: PrimaryDomainPlan): string[];
}

export class PrimaryDomainPlanCodeLengthRule implements PrimaryDomainPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryDomainPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryDomainPlanNameLengthRule implements PrimaryDomainPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryDomainPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryDomainPlanCodePrefixRule implements PrimaryDomainPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryDomainPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary domain plan. */
export class PrimaryDomainPlanValidator {
  rules: PrimaryDomainPlanRule[];

  constructor(rules: PrimaryDomainPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryDomainPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryDomainPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryDomainPlan[]): Map<string, string[]> {
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

export function defaultPrimaryDomainPlanValidator(): PrimaryDomainPlanValidator {
  return new PrimaryDomainPlanValidator(
    [
      new PrimaryDomainPlanCodeLengthRule(64),
      new PrimaryDomainPlanNameLengthRule(32),
      new PrimaryDomainPlanCodePrefixRule("REF"),
    ],
  );
}
