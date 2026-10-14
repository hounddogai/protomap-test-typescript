import { CsatAudit } from "./csat-audit.js";

/** A rule a csat audit must pass. Check returns its problems, or none. */
export interface CsatAuditRule {
  check(item: CsatAudit): string[];
}

export class CsatAuditRequiredCodeRule implements CsatAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CsatAuditRequiredNotesRule implements CsatAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatAudit): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class CsatAuditChannelLengthRule implements CsatAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat audit. */
export class CsatAuditValidator {
  rules: CsatAuditRule[];

  constructor(rules: CsatAuditRule[]) {
    this.rules = rules;
  }

  validate(item: CsatAudit): string[] {
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

  requireValid(item: CsatAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatAudit[]): Map<string, string[]> {
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

export function defaultCsatAuditValidator(): CsatAuditValidator {
  return new CsatAuditValidator(
    [
      new CsatAuditRequiredCodeRule("csat audit needs a value"),
      new CsatAuditRequiredNotesRule("csat audit needs a value"),
      new CsatAuditChannelLengthRule(64),
    ],
  );
}
