import * as text from "../../../../kit/text.js";
import { WeightedTicketViewAgreement } from "./weighted-ticket-view-agreement.js";

/** A rule a weighted ticket view agreement must pass. Check returns its problems, or none. */
export interface WeightedTicketViewAgreementRule {
  check(item: WeightedTicketViewAgreement): string[];
}

export class WeightedTicketViewAgreementSequenceRangeRule implements WeightedTicketViewAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedTicketViewAgreement): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedTicketViewAgreementAllowedCohortRule implements WeightedTicketViewAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedTicketViewAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is unknown`];
    return [];
  }
}

export class WeightedTicketViewAgreementCodeLengthRule implements WeightedTicketViewAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTicketViewAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTicketViewAgreementCodePrefixRule implements WeightedTicketViewAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedTicketViewAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedTicketViewAgreementCohortLengthRule implements WeightedTicketViewAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTicketViewAgreement): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTicketViewAgreementRequiredChannelRule implements WeightedTicketViewAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTicketViewAgreement): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted ticket view agreement. */
export class WeightedTicketViewAgreementValidator {
  rules: WeightedTicketViewAgreementRule[];

  constructor(rules: WeightedTicketViewAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTicketViewAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedTicketViewAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTicketViewAgreement[]): Map<string, string[]> {
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

export function defaultWeightedTicketViewAgreementValidator(): WeightedTicketViewAgreementValidator {
  return new WeightedTicketViewAgreementValidator(
    [
      new WeightedTicketViewAgreementSequenceRangeRule(16, 64),
      new WeightedTicketViewAgreementAllowedCohortRule([]),
      new WeightedTicketViewAgreementCodeLengthRule(1000),
      new WeightedTicketViewAgreementCodePrefixRule("X"),
      new WeightedTicketViewAgreementCohortLengthRule(80),
      new WeightedTicketViewAgreementRequiredChannelRule("weighted ticket view agreement needs this field"),
    ],
  );
}
