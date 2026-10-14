import { FunnelClaim } from "./funnel-claim.js";

/** A rule a funnel claim must pass. Check returns its problems, or none. */
export interface FunnelClaimRule {
  check(item: FunnelClaim): string[];
}

export class FunnelClaimFrequencyCapRangeRule implements FunnelClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelClaim): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelClaimArchivedGuardRule implements FunnelClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FunnelClaim): string[] {
    if (item.archived && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class FunnelClaimRatioRangeRule implements FunnelClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelClaim): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelClaimRevisionRangeRule implements FunnelClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelClaim): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a funnel claim. */
export class FunnelClaimValidator {
  rules: FunnelClaimRule[];

  constructor(rules: FunnelClaimRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelClaim[]): Map<string, string[]> {
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

export function defaultFunnelClaimValidator(): FunnelClaimValidator {
  return new FunnelClaimValidator(
    [
      new FunnelClaimFrequencyCapRangeRule(16, 255),
      new FunnelClaimArchivedGuardRule(80),
      new FunnelClaimRatioRangeRule(8.8, 223.4),
      new FunnelClaimRevisionRangeRule(16, 255),
    ],
  );
}
