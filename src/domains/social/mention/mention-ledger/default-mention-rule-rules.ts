import * as text from "../../../../kit/text.js";
import { DefaultMentionRule } from "./default-mention-rule.js";

/** A rule a default mention rule must pass. Check returns its problems, or none. */
export interface DefaultMentionRuleRule {
  check(item: DefaultMentionRule): string[];
}

export class DefaultMentionRuleRequiredCodeRule implements DefaultMentionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMentionRuleRequiredRegionRule implements DefaultMentionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionRule): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMentionRuleAllowedRegionRule implements DefaultMentionRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultMentionRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is out of range`];
    return [];
  }
}

export class DefaultMentionRuleRequiredLabelRule implements DefaultMentionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionRule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default mention rule. */
export class DefaultMentionRuleValidator {
  rules: DefaultMentionRuleRule[];

  constructor(rules: DefaultMentionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultMentionRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultMentionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultMentionRule[]): Map<string, string[]> {
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

export function defaultDefaultMentionRuleValidator(): DefaultMentionRuleValidator {
  return new DefaultMentionRuleValidator(
    [
      new DefaultMentionRuleRequiredCodeRule("default mention rule needs a value"),
      new DefaultMentionRuleRequiredRegionRule("default mention rule needs this field"),
      new DefaultMentionRuleAllowedRegionRule(["manual", "lenient", "adaptive"]),
      new DefaultMentionRuleRequiredLabelRule("default mention rule needs an entry"),
    ],
  );
}
