import { GlobalPacingAudit } from "./global-pacing-audit.js";

/** A rule a global pacing audit must pass. Check returns its problems, or none. */
export interface GlobalPacingAuditRule {
  check(item: GlobalPacingAudit): string[];
}

export class GlobalPacingAuditRequiredCodeRule implements GlobalPacingAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPacingAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPacingAuditLocaleLengthRule implements GlobalPacingAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPacingAudit): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPacingAuditRequiredNameRule implements GlobalPacingAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPacingAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPacingAuditRequiredLocaleRule implements GlobalPacingAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPacingAudit): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPacingAuditCodeLengthRule implements GlobalPacingAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPacingAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global pacing audit. */
export class GlobalPacingAuditValidator {
  rules: GlobalPacingAuditRule[];

  constructor(rules: GlobalPacingAuditRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPacingAudit): string[] {
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

  requireValid(item: GlobalPacingAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPacingAudit[]): Map<string, string[]> {
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

export function defaultGlobalPacingAuditValidator(): GlobalPacingAuditValidator {
  return new GlobalPacingAuditValidator(
    [
      new GlobalPacingAuditRequiredCodeRule("global pacing audit needs this field"),
      new GlobalPacingAuditLocaleLengthRule(80),
      new GlobalPacingAuditRequiredNameRule("global pacing audit needs an entry"),
      new GlobalPacingAuditRequiredLocaleRule("global pacing audit needs a value"),
      new GlobalPacingAuditCodeLengthRule(86400),
    ],
  );
}
