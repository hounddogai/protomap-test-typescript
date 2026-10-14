import { ScheduledInviteEntry } from "./scheduled-invite-entry.js";

/** A rule a scheduled invite entry must pass. Check returns its problems, or none. */
export interface ScheduledInviteEntryRule {
  check(item: ScheduledInviteEntry): string[];
}

export class ScheduledInviteEntryExternalRefLengthRule implements ScheduledInviteEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledInviteEntry): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledInviteEntryRequiredExternalRefRule implements ScheduledInviteEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledInviteEntry): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledInviteEntryRequiredLabelRule implements ScheduledInviteEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledInviteEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledInviteEntryBudgetRangeRule implements ScheduledInviteEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledInviteEntry): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled invite entry. */
export class ScheduledInviteEntryValidator {
  rules: ScheduledInviteEntryRule[];

  constructor(rules: ScheduledInviteEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledInviteEntry): string[] {
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

  requireValid(item: ScheduledInviteEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledInviteEntry[]): Map<string, string[]> {
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

export function defaultScheduledInviteEntryValidator(): ScheduledInviteEntryValidator {
  return new ScheduledInviteEntryValidator(
    [
      new ScheduledInviteEntryExternalRefLengthRule(255),
      new ScheduledInviteEntryRequiredExternalRefRule("scheduled invite entry needs a value"),
      new ScheduledInviteEntryRequiredLabelRule("scheduled invite entry needs a value"),
      new ScheduledInviteEntryBudgetRangeRule(3, 1070.5),
    ],
  );
}
