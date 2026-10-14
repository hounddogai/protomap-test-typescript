import { LevelRule } from "./level-rule.js";

/** A rule a level rule must pass. Check returns its problems, or none. */
export interface LevelRuleRule {
  check(item: LevelRule): string[];
}

export class LevelRuleRequiredCountryRule implements LevelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelRule): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LevelRuleCountryLengthRule implements LevelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelRule): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelRuleSummaryLengthRule implements LevelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelRule): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelRuleRequiredCodeRule implements LevelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelRuleCodeLengthRule implements LevelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level rule. */
export class LevelRuleValidator {
  rules: LevelRuleRule[];

  constructor(rules: LevelRuleRule[]) {
    this.rules = rules;
  }

  validate(item: LevelRule): string[] {
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

  requireValid(item: LevelRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelRule[]): Map<string, string[]> {
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

export function defaultLevelRuleValidator(): LevelRuleValidator {
  return new LevelRuleValidator(
    [
      new LevelRuleRequiredCountryRule("level rule needs this field"),
      new LevelRuleCountryLengthRule(255),
      new LevelRuleSummaryLengthRule(80),
      new LevelRuleRequiredCodeRule("level rule needs an entry"),
      new LevelRuleCodeLengthRule(80),
    ],
  );
}
