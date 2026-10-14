import { GlobalStepAudit } from "./global-step-audit.js";

/** A rule a global step audit must pass. Check returns its problems, or none. */
export interface GlobalStepAuditRule {
  check(item: GlobalStepAudit): string[];
}

export class GlobalStepAuditRequiredRegionRule implements GlobalStepAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalStepAudit): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalStepAuditRequiredLabelRule implements GlobalStepAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalStepAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalStepAuditCodeLengthRule implements GlobalStepAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStepAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global step audit. */
export class GlobalStepAuditValidator {
  rules: GlobalStepAuditRule[];

  constructor(rules: GlobalStepAuditRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalStepAudit): string[] {
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

  requireValid(item: GlobalStepAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalStepAudit[]): Map<string, string[]> {
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

export function defaultGlobalStepAuditValidator(): GlobalStepAuditValidator {
  return new GlobalStepAuditValidator(
    [
      new GlobalStepAuditRequiredRegionRule("global step audit needs a value"),
      new GlobalStepAuditRequiredLabelRule("global step audit needs an entry"),
      new GlobalStepAuditCodeLengthRule(80),
    ],
  );
}
