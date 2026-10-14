import * as text from "../../../../kit/text.js";
import { TicketViewAgreement } from "./ticket-view-agreement.js";

/** A rule a ticket view agreement must pass. Check returns its problems, or none. */
export interface TicketViewAgreementRule {
  check(item: TicketViewAgreement): string[];
}

export class TicketViewAgreementAllowedTimezoneRule implements TicketViewAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TicketViewAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is blocked`];
    return [];
  }
}

export class TicketViewAgreementTimezoneLengthRule implements TicketViewAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewAgreement): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewAgreementNameLengthRule implements TicketViewAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view agreement. */
export class TicketViewAgreementValidator {
  rules: TicketViewAgreementRule[];

  constructor(rules: TicketViewAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewAgreement): string[] {
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

  requireValid(item: TicketViewAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewAgreement[]): Map<string, string[]> {
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

export function defaultTicketViewAgreementValidator(): TicketViewAgreementValidator {
  return new TicketViewAgreementValidator(
    [
      new TicketViewAgreementAllowedTimezoneRule(["global", "regional", "capped"]),
      new TicketViewAgreementTimezoneLengthRule(1000),
      new TicketViewAgreementNameLengthRule(1000),
    ],
  );
}
