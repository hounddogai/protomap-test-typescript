import { PendingStreakAudit } from "./pending-streak-audit.js";

/** A rule a pending streak audit must pass. Check returns its problems, or none. */
export interface PendingStreakAuditRule {
  check(item: PendingStreakAudit): string[];
}

export class PendingStreakAuditRequiredPhoneRule implements PendingStreakAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStreakAudit): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PendingStreakAuditRequiredJourneyIdRule implements PendingStreakAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStreakAudit): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class PendingStreakAuditRequiredCodeRule implements PendingStreakAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStreakAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingStreakAuditTitleLengthRule implements PendingStreakAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingStreakAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingStreakAuditRequiredTitleRule implements PendingStreakAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStreakAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending streak audit. */
export class PendingStreakAuditValidator {
  rules: PendingStreakAuditRule[];

  constructor(rules: PendingStreakAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingStreakAudit): string[] {
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

  requireValid(item: PendingStreakAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingStreakAudit[]): Map<string, string[]> {
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

export function defaultPendingStreakAuditValidator(): PendingStreakAuditValidator {
  return new PendingStreakAuditValidator(
    [
      new PendingStreakAuditRequiredPhoneRule("pending streak audit needs an entry"),
      new PendingStreakAuditRequiredJourneyIdRule("pending streak audit needs a value"),
      new PendingStreakAuditRequiredCodeRule("pending streak audit needs an entry"),
      new PendingStreakAuditTitleLengthRule(1000),
      new PendingStreakAuditRequiredTitleRule("pending streak audit needs a value"),
    ],
  );
}
