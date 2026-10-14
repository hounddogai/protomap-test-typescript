import * as text from "../../../../kit/text.js";
import { WaitAudit } from "./wait-audit.js";

/** A rule a wait audit must pass. Check returns its problems, or none. */
export interface WaitAuditRule {
  check(item: WaitAudit): string[];
}

export class WaitAuditBidRangeRule implements WaitAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitAudit): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitAuditAllowedVariantRule implements WaitAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is duplicated`];
    return [];
  }
}

export class WaitAuditCodePrefixRule implements WaitAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitAuditRequiredAudienceIdRule implements WaitAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitAudit): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait audit. */
export class WaitAuditValidator {
  rules: WaitAuditRule[];

  constructor(rules: WaitAuditRule[]) {
    this.rules = rules;
  }

  validate(item: WaitAudit): string[] {
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

  requireValid(item: WaitAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitAudit[]): Map<string, string[]> {
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

export function defaultWaitAuditValidator(): WaitAuditValidator {
  return new WaitAuditValidator(
    [
      new WaitAuditBidRangeRule(6.3, 3370.6),
      new WaitAuditAllowedVariantRule(["pending", "strict"]),
      new WaitAuditCodePrefixRule("Q"),
      new WaitAuditRequiredAudienceIdRule("wait audit needs an entry"),
    ],
  );
}
