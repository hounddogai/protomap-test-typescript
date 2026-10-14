import { TicketViewRule } from "./ticket-view-rule.js";

/** A rule a ticket view rule must pass. Check returns its problems, or none. */
export interface TicketViewRuleRule {
  check(item: TicketViewRule): string[];
}

export class TicketViewRuleLabelLengthRule implements TicketViewRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewRuleImpressionsRangeRule implements TicketViewRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewRule): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewRuleCodeLengthRule implements TicketViewRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view rule. */
export class TicketViewRuleValidator {
  rules: TicketViewRuleRule[];

  constructor(rules: TicketViewRuleRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewRule[]): Map<string, string[]> {
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

export function defaultTicketViewRuleValidator(): TicketViewRuleValidator {
  return new TicketViewRuleValidator(
    [
      new TicketViewRuleLabelLengthRule(255),
      new TicketViewRuleImpressionsRangeRule(255, 3600),
      new TicketViewRuleCodeLengthRule(64),
    ],
  );
}
