import { PaywallAudit } from "./paywall-audit.js";

/** A rule a paywall audit must pass. Check returns its problems, or none. */
export interface PaywallAuditRule {
  check(item: PaywallAudit): string[];
}

export class PaywallAuditCodePrefixRule implements PaywallAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallAuditDiscountRangeRule implements PaywallAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallAudit): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallAuditRequiredSegmentRule implements PaywallAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallAudit): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall audit. */
export class PaywallAuditValidator {
  rules: PaywallAuditRule[];

  constructor(rules: PaywallAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallAudit[]): Map<string, string[]> {
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

export function defaultPaywallAuditValidator(): PaywallAuditValidator {
  return new PaywallAuditValidator(
    [
      new PaywallAuditCodePrefixRule("X"),
      new PaywallAuditDiscountRangeRule(3.7, 4431.8),
      new PaywallAuditRequiredSegmentRule("paywall audit needs this field"),
    ],
  );
}
