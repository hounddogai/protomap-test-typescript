import { FunnelAudit } from "./funnel-audit.js";

/** A rule a funnel audit must pass. Check returns its problems, or none. */
export interface FunnelAuditRule {
  check(item: FunnelAudit): string[];
}

export class FunnelAuditFrequencyCapRangeRule implements FunnelAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelAudit): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelAuditRequiredNotesRule implements FunnelAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelAudit): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelAuditCodeLengthRule implements FunnelAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelAuditRequiredNameRule implements FunnelAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a funnel audit. */
export class FunnelAuditValidator {
  rules: FunnelAuditRule[];

  constructor(rules: FunnelAuditRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelAudit): string[] {
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

  requireValid(item: FunnelAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelAudit[]): Map<string, string[]> {
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

export function defaultFunnelAuditValidator(): FunnelAuditValidator {
  return new FunnelAuditValidator(
    [
      new FunnelAuditFrequencyCapRangeRule(16, 86400),
      new FunnelAuditRequiredNotesRule("funnel audit needs this field"),
      new FunnelAuditCodeLengthRule(1000),
      new FunnelAuditRequiredNameRule("funnel audit needs this field"),
    ],
  );
}
