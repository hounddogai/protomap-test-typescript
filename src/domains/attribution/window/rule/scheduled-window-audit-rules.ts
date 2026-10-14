import * as text from "../../../../kit/text.js";
import { ScheduledWindowAudit } from "./scheduled-window-audit.js";

/** A rule a scheduled window audit must pass. Check returns its problems, or none. */
export interface ScheduledWindowAuditRule {
  check(item: ScheduledWindowAudit): string[];
}

export class ScheduledWindowAuditRequiredSourceRule implements ScheduledWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWindowAudit): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWindowAuditRequiredSegmentRule implements ScheduledWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWindowAudit): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWindowAuditRequiredTitleRule implements ScheduledWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWindowAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWindowAuditAllowedCodeRule implements ScheduledWindowAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledWindowAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a scheduled window audit. */
export class ScheduledWindowAuditValidator {
  rules: ScheduledWindowAuditRule[];

  constructor(rules: ScheduledWindowAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWindowAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledWindowAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWindowAudit[]): Map<string, string[]> {
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

export function defaultScheduledWindowAuditValidator(): ScheduledWindowAuditValidator {
  return new ScheduledWindowAuditValidator(
    [
      new ScheduledWindowAuditRequiredSourceRule("scheduled window audit needs a value"),
      new ScheduledWindowAuditRequiredSegmentRule("scheduled window audit needs a value"),
      new ScheduledWindowAuditRequiredTitleRule("scheduled window audit needs a value"),
      new ScheduledWindowAuditAllowedCodeRule(["capped", "rolling"]),
    ],
  );
}
