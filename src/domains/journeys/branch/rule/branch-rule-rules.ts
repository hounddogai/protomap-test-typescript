import * as text from "../../../../kit/text.js";
import { BranchRule } from "./branch-rule.js";

/** A rule a branch rule must pass. Check returns its problems, or none. */
export interface BranchRuleRule {
  check(item: BranchRule): string[];
}

export class BranchRuleRequiredCodeRule implements BranchRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchRuleAllowedJourneyIdRule implements BranchRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is too long`];
    return [];
  }
}

export class BranchRuleRequiredTitleRule implements BranchRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch rule. */
export class BranchRuleValidator {
  rules: BranchRuleRule[];

  constructor(rules: BranchRuleRule[]) {
    this.rules = rules;
  }

  validate(item: BranchRule): string[] {
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

  requireValid(item: BranchRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchRule[]): Map<string, string[]> {
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

export function defaultBranchRuleValidator(): BranchRuleValidator {
  return new BranchRuleValidator(
    [
      new BranchRuleRequiredCodeRule("branch rule needs this field"),
      new BranchRuleAllowedJourneyIdRule(["lenient", "primary", "fallback"]),
      new BranchRuleRequiredTitleRule("branch rule needs an entry"),
    ],
  );
}
