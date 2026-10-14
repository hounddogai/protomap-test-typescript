import { ManualTicketViewAgreement } from "./manual-ticket-view-agreement.js";

/** A rule a manual ticket view agreement must pass. Check returns its problems, or none. */
export interface ManualTicketViewAgreementRule {
  check(item: ManualTicketViewAgreement): string[];
}

export class ManualTicketViewAgreementRateRangeRule implements ManualTicketViewAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTicketViewAgreement): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualTicketViewAgreementChannelLengthRule implements ManualTicketViewAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTicketViewAgreement): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTicketViewAgreementCapacityRangeRule implements ManualTicketViewAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTicketViewAgreement): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualTicketViewAgreementTitleLengthRule implements ManualTicketViewAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTicketViewAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual ticket view agreement. */
export class ManualTicketViewAgreementValidator {
  rules: ManualTicketViewAgreementRule[];

  constructor(rules: ManualTicketViewAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTicketViewAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTicketViewAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTicketViewAgreement[]): Map<string, string[]> {
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

export function defaultManualTicketViewAgreementValidator(): ManualTicketViewAgreementValidator {
  return new ManualTicketViewAgreementValidator(
    [
      new ManualTicketViewAgreementRateRangeRule(8, 4168.6),
      new ManualTicketViewAgreementChannelLengthRule(1000),
      new ManualTicketViewAgreementCapacityRangeRule(80, 3600),
      new ManualTicketViewAgreementTitleLengthRule(64),
    ],
  );
}
