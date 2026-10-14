import { NudgeRule } from "./nudge-rule.js";

/** A rule a nudge rule must pass. Check returns its problems, or none. */
export interface NudgeRuleRule {
  check(item: NudgeRule): string[];
}

export class NudgeRuleNameLengthRule implements NudgeRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeRuleCampaignRefLengthRule implements NudgeRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeRule): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeRuleRequiredCodeRule implements NudgeRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeRuleRequiredTitleRule implements NudgeRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeRuleCodeLengthRule implements NudgeRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge rule. */
export class NudgeRuleValidator {
  rules: NudgeRuleRule[];

  constructor(rules: NudgeRuleRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeRule): string[] {
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

  requireValid(item: NudgeRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeRule[]): Map<string, string[]> {
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

export function defaultNudgeRuleValidator(): NudgeRuleValidator {
  return new NudgeRuleValidator(
    [
      new NudgeRuleNameLengthRule(1000),
      new NudgeRuleCampaignRefLengthRule(1000),
      new NudgeRuleRequiredCodeRule("nudge rule needs a value"),
      new NudgeRuleRequiredTitleRule("nudge rule needs an entry"),
      new NudgeRuleCodeLengthRule(86400),
    ],
  );
}
