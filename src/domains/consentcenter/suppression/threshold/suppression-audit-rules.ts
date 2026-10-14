import { SuppressionAudit } from "./suppression-audit.js";

/** A rule a suppression audit must pass. Check returns its problems, or none. */
export interface SuppressionAuditRule {
  check(item: SuppressionAudit): string[];
}

export class SuppressionAuditRequiredCodeRule implements SuppressionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionAuditUpdatedAtRangeRule implements SuppressionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionAudit): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionAuditRequiredLabelRule implements SuppressionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionAuditMaximumRangeRule implements SuppressionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionAudit): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a suppression audit. */
export class SuppressionAuditValidator {
  rules: SuppressionAuditRule[];

  constructor(rules: SuppressionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionAudit): string[] {
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

  requireValid(item: SuppressionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionAudit[]): Map<string, string[]> {
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

export function defaultSuppressionAuditValidator(): SuppressionAuditValidator {
  return new SuppressionAuditValidator(
    [
      new SuppressionAuditRequiredCodeRule("suppression audit needs this field"),
      new SuppressionAuditUpdatedAtRangeRule(32, 80),
      new SuppressionAuditRequiredLabelRule("suppression audit needs this field"),
      new SuppressionAuditMaximumRangeRule(3.5, 1904),
    ],
  );
}
