import { GlobalSlaMilestone } from "./global-sla-milestone.js";

/** A rule a global sla milestone must pass. Check returns its problems, or none. */
export interface GlobalSlaMilestoneRule {
  check(item: GlobalSlaMilestone): string[];
}

export class GlobalSlaMilestoneCodeLengthRule implements GlobalSlaMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSlaMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSlaMilestoneRequiredLabelRule implements GlobalSlaMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSlaMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSlaMilestoneContactEmailLengthRule implements GlobalSlaMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSlaMilestone): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSlaMilestoneRequiredContactEmailRule implements GlobalSlaMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSlaMilestone): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global sla milestone. */
export class GlobalSlaMilestoneValidator {
  rules: GlobalSlaMilestoneRule[];

  constructor(rules: GlobalSlaMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSlaMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalSlaMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSlaMilestone[]): Map<string, string[]> {
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

export function defaultGlobalSlaMilestoneValidator(): GlobalSlaMilestoneValidator {
  return new GlobalSlaMilestoneValidator(
    [
      new GlobalSlaMilestoneCodeLengthRule(32),
      new GlobalSlaMilestoneRequiredLabelRule("global sla milestone needs an entry"),
      new GlobalSlaMilestoneContactEmailLengthRule(32),
      new GlobalSlaMilestoneRequiredContactEmailRule("global sla milestone needs an entry"),
    ],
  );
}
