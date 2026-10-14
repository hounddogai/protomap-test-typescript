import { SubscriptionAudit } from "./subscription-audit.js";

/** A rule a subscription audit must pass. Check returns its problems, or none. */
export interface SubscriptionAuditRule {
  check(item: SubscriptionAudit): string[];
}

export class SubscriptionAuditRequiredLabelRule implements SubscriptionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionAuditCodePrefixRule implements SubscriptionAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionAuditLabelLengthRule implements SubscriptionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionAuditUtmSourceLengthRule implements SubscriptionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionAudit): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionAuditExpiresAtRangeRule implements SubscriptionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionAudit): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a subscription audit. */
export class SubscriptionAuditValidator {
  rules: SubscriptionAuditRule[];

  constructor(rules: SubscriptionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionAudit): string[] {
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

  requireValid(item: SubscriptionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionAudit[]): Map<string, string[]> {
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

export function defaultSubscriptionAuditValidator(): SubscriptionAuditValidator {
  return new SubscriptionAuditValidator(
    [
      new SubscriptionAuditRequiredLabelRule("subscription audit needs a value"),
      new SubscriptionAuditCodePrefixRule("X"),
      new SubscriptionAuditLabelLengthRule(86400),
      new SubscriptionAuditUtmSourceLengthRule(255),
      new SubscriptionAuditExpiresAtRangeRule(16, 86400),
    ],
  );
}
