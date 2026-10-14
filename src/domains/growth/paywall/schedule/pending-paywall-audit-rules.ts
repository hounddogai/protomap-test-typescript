import { PendingPaywallAudit } from "./pending-paywall-audit.js";

/** A rule a pending paywall audit must pass. Check returns its problems, or none. */
export interface PendingPaywallAuditRule {
  check(item: PendingPaywallAudit): string[];
}

export class PendingPaywallAuditSourceLengthRule implements PendingPaywallAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPaywallAudit): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPaywallAuditRetriesRangeRule implements PendingPaywallAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPaywallAudit): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingPaywallAuditSendAtRangeRule implements PendingPaywallAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPaywallAudit): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingPaywallAuditRequiredLabelRule implements PendingPaywallAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPaywallAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending paywall audit. */
export class PendingPaywallAuditValidator {
  rules: PendingPaywallAuditRule[];

  constructor(rules: PendingPaywallAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPaywallAudit): string[] {
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

  requireValid(item: PendingPaywallAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPaywallAudit[]): Map<string, string[]> {
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

export function defaultPendingPaywallAuditValidator(): PendingPaywallAuditValidator {
  return new PendingPaywallAuditValidator(
    [
      new PendingPaywallAuditSourceLengthRule(16),
      new PendingPaywallAuditRetriesRangeRule(32, 80),
      new PendingPaywallAuditSendAtRangeRule(32, 3600),
      new PendingPaywallAuditRequiredLabelRule("pending paywall audit needs a value"),
    ],
  );
}
