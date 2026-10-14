import { LegacyInviteRule } from "./legacy-invite-rule.js";

/** A rule a legacy invite rule must pass. Check returns its problems, or none. */
export interface LegacyInviteRuleRule {
  check(item: LegacyInviteRule): string[];
}

export class LegacyInviteRuleRequiredCodeRule implements LegacyInviteRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyInviteRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyInviteRuleAmountRangeRule implements LegacyInviteRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyInviteRule): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyInviteRuleCeilingRangeRule implements LegacyInviteRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyInviteRule): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy invite rule. */
export class LegacyInviteRuleValidator {
  rules: LegacyInviteRuleRule[];

  constructor(rules: LegacyInviteRuleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyInviteRule): string[] {
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

  requireValid(item: LegacyInviteRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyInviteRule[]): Map<string, string[]> {
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

export function defaultLegacyInviteRuleValidator(): LegacyInviteRuleValidator {
  return new LegacyInviteRuleValidator(
    [
      new LegacyInviteRuleRequiredCodeRule("legacy invite rule needs an entry"),
      new LegacyInviteRuleAmountRangeRule(4.7, 2310.6),
      new LegacyInviteRuleCeilingRangeRule(9.6, 1180.3),
    ],
  );
}
