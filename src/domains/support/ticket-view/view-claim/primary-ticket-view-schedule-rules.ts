import * as text from "../../../../kit/text.js";
import { PrimaryTicketViewSchedule } from "./primary-ticket-view-schedule.js";

/** A rule a primary ticket view schedule must pass. Check returns its problems, or none. */
export interface PrimaryTicketViewScheduleRule {
  check(item: PrimaryTicketViewSchedule): string[];
}

export class PrimaryTicketViewScheduleAllowedLabelRule implements PrimaryTicketViewScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryTicketViewSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class PrimaryTicketViewScheduleRequiredOwnerIdRule implements PrimaryTicketViewScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTicketViewSchedule): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTicketViewScheduleRequiredCountryRule implements PrimaryTicketViewScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTicketViewSchedule): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary ticket view schedule. */
export class PrimaryTicketViewScheduleValidator {
  rules: PrimaryTicketViewScheduleRule[];

  constructor(rules: PrimaryTicketViewScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTicketViewSchedule): string[] {
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

  requireValid(item: PrimaryTicketViewSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTicketViewSchedule[]): Map<string, string[]> {
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

export function defaultPrimaryTicketViewScheduleValidator(): PrimaryTicketViewScheduleValidator {
  return new PrimaryTicketViewScheduleValidator(
    [
      new PrimaryTicketViewScheduleAllowedLabelRule(["fallback"]),
      new PrimaryTicketViewScheduleRequiredOwnerIdRule("primary ticket view schedule needs an entry"),
      new PrimaryTicketViewScheduleRequiredCountryRule("primary ticket view schedule needs this field"),
    ],
  );
}
