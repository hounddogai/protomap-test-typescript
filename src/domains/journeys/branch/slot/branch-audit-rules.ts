import * as text from "../../../../kit/text.js";
import { BranchAudit } from "./branch-audit.js";

/** A rule a branch audit must pass. Check returns its problems, or none. */
export interface BranchAuditRule {
  check(item: BranchAudit): string[];
}

export class BranchAuditDurationMinutesRangeRule implements BranchAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchAudit): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchAuditWindowDaysRangeRule implements BranchAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchAudit): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchAuditRequiredNameRule implements BranchAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BranchAuditAllowedCodeRule implements BranchAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class BranchAuditCodePrefixRule implements BranchAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchAuditRequiredCodeRule implements BranchAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch audit. */
export class BranchAuditValidator {
  rules: BranchAuditRule[];

  constructor(rules: BranchAuditRule[]) {
    this.rules = rules;
  }

  validate(item: BranchAudit): string[] {
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

  requireValid(item: BranchAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchAudit[]): Map<string, string[]> {
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

export function defaultBranchAuditValidator(): BranchAuditValidator {
  return new BranchAuditValidator(
    [
      new BranchAuditDurationMinutesRangeRule(255, 86400),
      new BranchAuditWindowDaysRangeRule(32, 1000),
      new BranchAuditRequiredNameRule("branch audit needs this field"),
      new BranchAuditAllowedCodeRule(["fallback"]),
      new BranchAuditCodePrefixRule("OPS"),
      new BranchAuditRequiredCodeRule("branch audit needs an entry"),
    ],
  );
}
