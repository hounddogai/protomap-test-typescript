import { ScheduledCohortQuota } from "./scheduled-cohort-quota.js";

/** A rule a scheduled cohort quota must pass. Check returns its problems, or none. */
export interface ScheduledCohortQuotaRule {
  check(item: ScheduledCohortQuota): string[];
}

export class ScheduledCohortQuotaUtmSourceLengthRule implements ScheduledCohortQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCohortQuota): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCohortQuotaArchivedGuardRule implements ScheduledCohortQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledCohortQuota): string[] {
    if (item.archived && item.floorValue > this.limit) return [`floor value ${item.floorValue} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ScheduledCohortQuotaCodePrefixRule implements ScheduledCohortQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledCohortQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledCohortQuotaRequiredUtmSourceRule implements ScheduledCohortQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCohortQuota): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled cohort quota. */
export class ScheduledCohortQuotaValidator {
  rules: ScheduledCohortQuotaRule[];

  constructor(rules: ScheduledCohortQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCohortQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCohortQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCohortQuota[]): Map<string, string[]> {
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

export function defaultScheduledCohortQuotaValidator(): ScheduledCohortQuotaValidator {
  return new ScheduledCohortQuotaValidator(
    [
      new ScheduledCohortQuotaUtmSourceLengthRule(1000),
      new ScheduledCohortQuotaArchivedGuardRule(7.8),
      new ScheduledCohortQuotaCodePrefixRule("REF"),
      new ScheduledCohortQuotaRequiredUtmSourceRule("scheduled cohort quota needs an entry"),
    ],
  );
}
