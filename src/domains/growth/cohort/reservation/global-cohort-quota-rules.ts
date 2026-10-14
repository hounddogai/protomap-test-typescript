import { GlobalCohortQuota } from "./global-cohort-quota.js";

/** A rule a global cohort quota must pass. Check returns its problems, or none. */
export interface GlobalCohortQuotaRule {
  check(item: GlobalCohortQuota): string[];
}

export class GlobalCohortQuotaExpiresAtRangeRule implements GlobalCohortQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCohortQuota): string[] {
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

export class GlobalCohortQuotaMinimumRangeRule implements GlobalCohortQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCohortQuota): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalCohortQuotaRequiredLocaleRule implements GlobalCohortQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCohortQuota): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCohortQuotaRequiredNameRule implements GlobalCohortQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCohortQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCohortQuotaRequiredChannelRule implements GlobalCohortQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCohortQuota): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global cohort quota. */
export class GlobalCohortQuotaValidator {
  rules: GlobalCohortQuotaRule[];

  constructor(rules: GlobalCohortQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCohortQuota): string[] {
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

  requireValid(item: GlobalCohortQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCohortQuota[]): Map<string, string[]> {
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

export function defaultGlobalCohortQuotaValidator(): GlobalCohortQuotaValidator {
  return new GlobalCohortQuotaValidator(
    [
      new GlobalCohortQuotaExpiresAtRangeRule(3600, 86400),
      new GlobalCohortQuotaMinimumRangeRule(8, 1514.5),
      new GlobalCohortQuotaRequiredLocaleRule("global cohort quota needs an entry"),
      new GlobalCohortQuotaRequiredNameRule("global cohort quota needs this field"),
      new GlobalCohortQuotaRequiredChannelRule("global cohort quota needs this field"),
    ],
  );
}
