import * as text from "../../../../kit/text.js";
import { StrictRewardRuleReservation } from "./strict-reward-rule-reservation.js";

/** A rule a strict reward rule reservation must pass. Check returns its problems, or none. */
export interface StrictRewardRuleReservationRule {
  check(item: StrictRewardRuleReservation): string[];
}

export class StrictRewardRuleReservationCostRangeRule implements StrictRewardRuleReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRewardRuleReservation): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictRewardRuleReservationCodeLengthRule implements StrictRewardRuleReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardRuleReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardRuleReservationRequiredExternalRefRule implements StrictRewardRuleReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardRuleReservation): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardRuleReservationAllowedCodeRule implements StrictRewardRuleReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRewardRuleReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

/** Runs every rule of a strict reward rule reservation. */
export class StrictRewardRuleReservationValidator {
  rules: StrictRewardRuleReservationRule[];

  constructor(rules: StrictRewardRuleReservationRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardRuleReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictRewardRuleReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardRuleReservation[]): Map<string, string[]> {
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

export function defaultStrictRewardRuleReservationValidator(): StrictRewardRuleReservationValidator {
  return new StrictRewardRuleReservationValidator(
    [
      new StrictRewardRuleReservationCostRangeRule(6.2, 2029),
      new StrictRewardRuleReservationCodeLengthRule(120),
      new StrictRewardRuleReservationRequiredExternalRefRule("strict reward rule reservation needs a value"),
      new StrictRewardRuleReservationAllowedCodeRule(["seasonal"]),
    ],
  );
}
