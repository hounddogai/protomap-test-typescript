import { WindowAudit } from "./window-audit.js";

/** A rule a window audit must pass. Check returns its problems, or none. */
export interface WindowAuditRule {
  check(item: WindowAudit): string[];
}

export class WindowAuditRequiredCodeRule implements WindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WindowAuditRequiredUnitRule implements WindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowAudit): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class WindowAuditCodePrefixRule implements WindowAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a window audit. */
export class WindowAuditValidator {
  rules: WindowAuditRule[];

  constructor(rules: WindowAuditRule[]) {
    this.rules = rules;
  }

  validate(item: WindowAudit): string[] {
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

  requireValid(item: WindowAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowAudit[]): Map<string, string[]> {
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

export function defaultWindowAuditValidator(): WindowAuditValidator {
  return new WindowAuditValidator(
    [
      new WindowAuditRequiredCodeRule("window audit needs a value"),
      new WindowAuditRequiredUnitRule("window audit needs a value"),
      new WindowAuditCodePrefixRule("Q"),
    ],
  );
}
