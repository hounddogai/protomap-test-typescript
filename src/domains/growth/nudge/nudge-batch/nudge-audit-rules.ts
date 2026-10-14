import * as text from "../../../../kit/text.js";
import { NudgeAudit } from "./nudge-audit.js";

/** A rule a nudge audit must pass. Check returns its problems, or none. */
export interface NudgeAuditRule {
  check(item: NudgeAudit): string[];
}

export class NudgeAuditAllowedCodeRule implements NudgeAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class NudgeAuditRequiredLocaleRule implements NudgeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeAudit): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeAuditCodePrefixRule implements NudgeAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeAuditRequiredCodeRule implements NudgeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeAuditRequiredUnitRule implements NudgeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeAudit): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeAuditNameLengthRule implements NudgeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge audit. */
export class NudgeAuditValidator {
  rules: NudgeAuditRule[];

  constructor(rules: NudgeAuditRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeAudit): string[] {
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

  requireValid(item: NudgeAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeAudit[]): Map<string, string[]> {
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

export function defaultNudgeAuditValidator(): NudgeAuditValidator {
  return new NudgeAuditValidator(
    [
      new NudgeAuditAllowedCodeRule([]),
      new NudgeAuditRequiredLocaleRule("nudge audit needs an entry"),
      new NudgeAuditCodePrefixRule("OPS"),
      new NudgeAuditRequiredCodeRule("nudge audit needs this field"),
      new NudgeAuditRequiredUnitRule("nudge audit needs an entry"),
      new NudgeAuditNameLengthRule(120),
    ],
  );
}
