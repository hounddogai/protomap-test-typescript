import * as text from "../../../../kit/text.js";
import { LegacyRewardRuleVariance } from "./legacy-reward-rule-variance.js";

/** A rule a legacy reward rule variance must pass. Check returns its problems, or none. */
export interface LegacyRewardRuleVarianceRule {
  check(item: LegacyRewardRuleVariance): string[];
}

export class LegacyRewardRuleVarianceRequiredCategoryRule implements LegacyRewardRuleVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRewardRuleVariance): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyRewardRuleVarianceRequiredCodeRule implements LegacyRewardRuleVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyRewardRuleVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyRewardRuleVarianceAllowedCodeRule implements LegacyRewardRuleVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyRewardRuleVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a legacy reward rule variance. */
export class LegacyRewardRuleVarianceValidator {
  rules: LegacyRewardRuleVarianceRule[];

  constructor(rules: LegacyRewardRuleVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyRewardRuleVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyRewardRuleVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyRewardRuleVariance[]): Map<string, string[]> {
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

export function defaultLegacyRewardRuleVarianceValidator(): LegacyRewardRuleVarianceValidator {
  return new LegacyRewardRuleVarianceValidator(
    [
      new LegacyRewardRuleVarianceRequiredCategoryRule("legacy reward rule variance needs this field"),
      new LegacyRewardRuleVarianceRequiredCodeRule("legacy reward rule variance needs a value"),
      new LegacyRewardRuleVarianceAllowedCodeRule([]),
    ],
  );
}
