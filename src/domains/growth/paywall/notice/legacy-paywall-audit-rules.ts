import { LegacyPaywallAudit } from "./legacy-paywall-audit.js";

/** A rule a legacy paywall audit must pass. Check returns its problems, or none. */
export interface LegacyPaywallAuditRule {
  check(item: LegacyPaywallAudit): string[];
}

export class LegacyPaywallAuditTitleLengthRule implements LegacyPaywallAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPaywallAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPaywallAuditRequiredTitleRule implements LegacyPaywallAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPaywallAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPaywallAuditVersionRangeRule implements LegacyPaywallAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPaywallAudit): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy paywall audit. */
export class LegacyPaywallAuditValidator {
  rules: LegacyPaywallAuditRule[];

  constructor(rules: LegacyPaywallAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPaywallAudit): string[] {
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

  requireValid(item: LegacyPaywallAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPaywallAudit[]): Map<string, string[]> {
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

export function defaultLegacyPaywallAuditValidator(): LegacyPaywallAuditValidator {
  return new LegacyPaywallAuditValidator(
    [
      new LegacyPaywallAuditTitleLengthRule(120),
      new LegacyPaywallAuditRequiredTitleRule("legacy paywall audit needs a value"),
      new LegacyPaywallAuditVersionRangeRule(64, 3600),
    ],
  );
}
