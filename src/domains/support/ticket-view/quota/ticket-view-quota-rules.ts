import { TicketViewQuota } from "./ticket-view-quota.js";

/** A rule a ticket view quota must pass. Check returns its problems, or none. */
export interface TicketViewQuotaRule {
  check(item: TicketViewQuota): string[];
}

export class TicketViewQuotaExpiresAtRangeRule implements TicketViewQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewQuota): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewQuotaCodeLengthRule implements TicketViewQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewQuotaNameLengthRule implements TicketViewQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewQuotaCodePrefixRule implements TicketViewQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a ticket view quota. */
export class TicketViewQuotaValidator {
  rules: TicketViewQuotaRule[];

  constructor(rules: TicketViewQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewQuota): string[] {
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

  requireValid(item: TicketViewQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewQuota[]): Map<string, string[]> {
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

export function defaultTicketViewQuotaValidator(): TicketViewQuotaValidator {
  return new TicketViewQuotaValidator(
    [
      new TicketViewQuotaExpiresAtRangeRule(80, 120),
      new TicketViewQuotaCodeLengthRule(32),
      new TicketViewQuotaNameLengthRule(16),
      new TicketViewQuotaCodePrefixRule("REF"),
    ],
  );
}
