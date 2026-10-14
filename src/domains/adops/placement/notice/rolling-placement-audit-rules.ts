import { RollingPlacementAudit } from "./rolling-placement-audit.js";

/** A rule a rolling placement audit must pass. Check returns its problems, or none. */
export interface RollingPlacementAuditRule {
  check(item: RollingPlacementAudit): string[];
}

export class RollingPlacementAuditCodeLengthRule implements RollingPlacementAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPlacementAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPlacementAuditCodePrefixRule implements RollingPlacementAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingPlacementAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingPlacementAuditLabelLengthRule implements RollingPlacementAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPlacementAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling placement audit. */
export class RollingPlacementAuditValidator {
  rules: RollingPlacementAuditRule[];

  constructor(rules: RollingPlacementAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPlacementAudit): string[] {
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

  requireValid(item: RollingPlacementAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPlacementAudit[]): Map<string, string[]> {
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

export function defaultRollingPlacementAuditValidator(): RollingPlacementAuditValidator {
  return new RollingPlacementAuditValidator(
    [
      new RollingPlacementAuditCodeLengthRule(80),
      new RollingPlacementAuditCodePrefixRule("Q"),
      new RollingPlacementAuditLabelLengthRule(1000),
    ],
  );
}
