import { ScheduledTouchpointQuota } from "./scheduled-touchpoint-quota.js";

/** A rule a scheduled touchpoint quota must pass. Check returns its problems, or none. */
export interface ScheduledTouchpointQuotaRule {
  check(item: ScheduledTouchpointQuota): string[];
}

export class ScheduledTouchpointQuotaLabelLengthRule implements ScheduledTouchpointQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTouchpointQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledTouchpointQuotaWeightRangeRule implements ScheduledTouchpointQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointQuota): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledTouchpointQuotaPriorityRangeRule implements ScheduledTouchpointQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointQuota): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledTouchpointQuotaMinimumRangeRule implements ScheduledTouchpointQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointQuota): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledTouchpointQuotaCodePrefixRule implements ScheduledTouchpointQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledTouchpointQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled touchpoint quota. */
export class ScheduledTouchpointQuotaValidator {
  rules: ScheduledTouchpointQuotaRule[];

  constructor(rules: ScheduledTouchpointQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledTouchpointQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledTouchpointQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledTouchpointQuota[]): Map<string, string[]> {
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

export function defaultScheduledTouchpointQuotaValidator(): ScheduledTouchpointQuotaValidator {
  return new ScheduledTouchpointQuotaValidator(
    [
      new ScheduledTouchpointQuotaLabelLengthRule(16),
      new ScheduledTouchpointQuotaWeightRangeRule(6.9, 3784.9),
      new ScheduledTouchpointQuotaPriorityRangeRule(32, 1000),
      new ScheduledTouchpointQuotaMinimumRangeRule(9.5, 1145.8),
      new ScheduledTouchpointQuotaCodePrefixRule("ACM"),
    ],
  );
}
