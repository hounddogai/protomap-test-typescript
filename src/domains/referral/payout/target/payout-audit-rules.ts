import * as text from "../../../../kit/text.js";
import { PayoutAudit } from "./payout-audit.js";

/** A rule a payout audit must pass. Check returns its problems, or none. */
export interface PayoutAuditRule {
  check(item: PayoutAudit): string[];
}

export class PayoutAuditRequiredCodeRule implements PayoutAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutAuditRequiredAudienceIdRule implements PayoutAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutAudit): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutAuditAllowedNameRule implements PayoutAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class PayoutAuditTitleLengthRule implements PayoutAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutAuditRequiredNameRule implements PayoutAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a payout audit. */
export class PayoutAuditValidator {
  rules: PayoutAuditRule[];

  constructor(rules: PayoutAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutAudit): string[] {
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

  requireValid(item: PayoutAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutAudit[]): Map<string, string[]> {
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

export function defaultPayoutAuditValidator(): PayoutAuditValidator {
  return new PayoutAuditValidator(
    [
      new PayoutAuditRequiredCodeRule("payout audit needs a value"),
      new PayoutAuditRequiredAudienceIdRule("payout audit needs a value"),
      new PayoutAuditAllowedNameRule([]),
      new PayoutAuditTitleLengthRule(86400),
      new PayoutAuditRequiredNameRule("payout audit needs a value"),
    ],
  );
}
