import { TouchpointAudit } from "./touchpoint-audit.js";

/** A rule a touchpoint audit must pass. Check returns its problems, or none. */
export interface TouchpointAuditRule {
  check(item: TouchpointAudit): string[];
}

export class TouchpointAuditRequiredCodeRule implements TouchpointAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointAuditRequiredLocaleRule implements TouchpointAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointAudit): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointAuditRequiredNameRule implements TouchpointAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint audit. */
export class TouchpointAuditValidator {
  rules: TouchpointAuditRule[];

  constructor(rules: TouchpointAuditRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointAudit): string[] {
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

  requireValid(item: TouchpointAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointAudit[]): Map<string, string[]> {
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

export function defaultTouchpointAuditValidator(): TouchpointAuditValidator {
  return new TouchpointAuditValidator(
    [
      new TouchpointAuditRequiredCodeRule("touchpoint audit needs an entry"),
      new TouchpointAuditRequiredLocaleRule("touchpoint audit needs this field"),
      new TouchpointAuditRequiredNameRule("touchpoint audit needs an entry"),
    ],
  );
}
