import * as text from "../../../../kit/text.js";
import { RegionalExitRuleMapping } from "./regional-exit-rule-mapping.js";

/** A rule a regional exit rule mapping must pass. Check returns its problems, or none. */
export interface RegionalExitRuleMappingRule {
  check(item: RegionalExitRuleMapping): string[];
}

export class RegionalExitRuleMappingAllowedReviewerRule implements RegionalExitRuleMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalExitRuleMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is expired`];
    return [];
  }
}

export class RegionalExitRuleMappingLabelLengthRule implements RegionalExitRuleMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalExitRuleMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalExitRuleMappingRequiredLabelRule implements RegionalExitRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalExitRuleMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalExitRuleMappingCodeLengthRule implements RegionalExitRuleMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalExitRuleMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalExitRuleMappingRequiredCodeRule implements RegionalExitRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalExitRuleMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional exit rule mapping. */
export class RegionalExitRuleMappingValidator {
  rules: RegionalExitRuleMappingRule[];

  constructor(rules: RegionalExitRuleMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalExitRuleMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalExitRuleMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalExitRuleMapping[]): Map<string, string[]> {
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

export function defaultRegionalExitRuleMappingValidator(): RegionalExitRuleMappingValidator {
  return new RegionalExitRuleMappingValidator(
    [
      new RegionalExitRuleMappingAllowedReviewerRule(["legacy", "manual", "batched"]),
      new RegionalExitRuleMappingLabelLengthRule(255),
      new RegionalExitRuleMappingRequiredLabelRule("regional exit rule mapping needs this field"),
      new RegionalExitRuleMappingCodeLengthRule(64),
      new RegionalExitRuleMappingRequiredCodeRule("regional exit rule mapping needs an entry"),
    ],
  );
}
