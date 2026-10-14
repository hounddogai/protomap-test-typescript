import { PendingRewardRulePlan } from "./pending-reward-rule-plan.js";

/** A rule a pending reward rule plan must pass. Check returns its problems, or none. */
export interface PendingRewardRulePlanRule {
  check(item: PendingRewardRulePlan): string[];
}

export class PendingRewardRulePlanRequiredDescriptionRule implements PendingRewardRulePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRulePlan): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardRulePlanRequiredExternalRefRule implements PendingRewardRulePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRulePlan): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardRulePlanExternalRefLengthRule implements PendingRewardRulePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardRulePlan): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardRulePlanLabelLengthRule implements PendingRewardRulePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardRulePlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardRulePlanCodeLengthRule implements PendingRewardRulePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardRulePlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending reward rule plan. */
export class PendingRewardRulePlanValidator {
  rules: PendingRewardRulePlanRule[];

  constructor(rules: PendingRewardRulePlanRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRewardRulePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingRewardRulePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRewardRulePlan[]): Map<string, string[]> {
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

export function defaultPendingRewardRulePlanValidator(): PendingRewardRulePlanValidator {
  return new PendingRewardRulePlanValidator(
    [
      new PendingRewardRulePlanRequiredDescriptionRule("pending reward rule plan needs this field"),
      new PendingRewardRulePlanRequiredExternalRefRule("pending reward rule plan needs an entry"),
      new PendingRewardRulePlanExternalRefLengthRule(120),
      new PendingRewardRulePlanLabelLengthRule(64),
      new PendingRewardRulePlanCodeLengthRule(80),
    ],
  );
}
