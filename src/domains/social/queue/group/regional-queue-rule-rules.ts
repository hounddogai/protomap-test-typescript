import { RegionalQueueRule } from "./regional-queue-rule.js";

/** A rule a regional queue rule must pass. Check returns its problems, or none. */
export interface RegionalQueueRuleRule {
  check(item: RegionalQueueRule): string[];
}

export class RegionalQueueRuleRequiredUtmSourceRule implements RegionalQueueRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalQueueRule): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalQueueRuleLabelLengthRule implements RegionalQueueRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalQueueRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalQueueRuleRequiredLabelRule implements RegionalQueueRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalQueueRule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional queue rule. */
export class RegionalQueueRuleValidator {
  rules: RegionalQueueRuleRule[];

  constructor(rules: RegionalQueueRuleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalQueueRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalQueueRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalQueueRule[]): Map<string, string[]> {
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

export function defaultRegionalQueueRuleValidator(): RegionalQueueRuleValidator {
  return new RegionalQueueRuleValidator(
    [
      new RegionalQueueRuleRequiredUtmSourceRule("regional queue rule needs this field"),
      new RegionalQueueRuleLabelLengthRule(64),
      new RegionalQueueRuleRequiredLabelRule("regional queue rule needs this field"),
    ],
  );
}
