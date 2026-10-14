import { FallbackSuppressionAudit } from "./fallback-suppression-audit.js";

/** A rule a fallback suppression audit must pass. Check returns its problems, or none. */
export interface FallbackSuppressionAuditRule {
  check(item: FallbackSuppressionAudit): string[];
}

export class FallbackSuppressionAuditRequiredOwnerIdRule implements FallbackSuppressionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSuppressionAudit): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSuppressionAuditCodeLengthRule implements FallbackSuppressionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSuppressionAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSuppressionAuditConversionRateRangeRule implements FallbackSuppressionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSuppressionAudit): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackSuppressionAuditPinnedGuardRule implements FallbackSuppressionAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackSuppressionAudit): string[] {
    if (item.pinned && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class FallbackSuppressionAuditRequiredTitleRule implements FallbackSuppressionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSuppressionAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback suppression audit. */
export class FallbackSuppressionAuditValidator {
  rules: FallbackSuppressionAuditRule[];

  constructor(rules: FallbackSuppressionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSuppressionAudit): string[] {
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

  requireValid(item: FallbackSuppressionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSuppressionAudit[]): Map<string, string[]> {
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

export function defaultFallbackSuppressionAuditValidator(): FallbackSuppressionAuditValidator {
  return new FallbackSuppressionAuditValidator(
    [
      new FallbackSuppressionAuditRequiredOwnerIdRule("fallback suppression audit needs this field"),
      new FallbackSuppressionAuditCodeLengthRule(16),
      new FallbackSuppressionAuditConversionRateRangeRule(3.4, 3716.4),
      new FallbackSuppressionAuditPinnedGuardRule(32),
      new FallbackSuppressionAuditRequiredTitleRule("fallback suppression audit needs this field"),
    ],
  );
}
