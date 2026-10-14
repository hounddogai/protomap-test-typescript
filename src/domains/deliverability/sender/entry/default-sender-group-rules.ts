import { DefaultSenderGroup } from "./default-sender-group.js";

/** A rule a default sender group must pass. Check returns its problems, or none. */
export interface DefaultSenderGroupRule {
  check(item: DefaultSenderGroup): string[];
}

export class DefaultSenderGroupOpenRateRangeRule implements DefaultSenderGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSenderGroup): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultSenderGroupLimitRangeRule implements DefaultSenderGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSenderGroup): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultSenderGroupApprovedGuardRule implements DefaultSenderGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultSenderGroup): string[] {
    if (item.approved && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a default sender group. */
export class DefaultSenderGroupValidator {
  rules: DefaultSenderGroupRule[];

  constructor(rules: DefaultSenderGroupRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSenderGroup): string[] {
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

  requireValid(item: DefaultSenderGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSenderGroup[]): Map<string, string[]> {
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

export function defaultDefaultSenderGroupValidator(): DefaultSenderGroupValidator {
  return new DefaultSenderGroupValidator(
    [
      new DefaultSenderGroupOpenRateRangeRule(5.1, 3941.6),
      new DefaultSenderGroupLimitRangeRule(80, 3600),
      new DefaultSenderGroupApprovedGuardRule(80),
    ],
  );
}
