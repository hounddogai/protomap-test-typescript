import { TierAudit } from "./tier-audit.js";

/** A rule a tier audit must pass. Check returns its problems, or none. */
export interface TierAuditRule {
  check(item: TierAudit): string[];
}

export class TierAuditGraceDaysRangeRule implements TierAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierAudit): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TierAuditRegionLengthRule implements TierAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierAudit): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierAuditRatioRangeRule implements TierAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierAudit): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierAuditOpenRateRangeRule implements TierAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierAudit): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TierAuditRequiredDescriptionRule implements TierAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierAudit): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier audit. */
export class TierAuditValidator {
  rules: TierAuditRule[];

  constructor(rules: TierAuditRule[]) {
    this.rules = rules;
  }

  validate(item: TierAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierAudit[]): Map<string, string[]> {
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

export function defaultTierAuditValidator(): TierAuditValidator {
  return new TierAuditValidator(
    [
      new TierAuditGraceDaysRangeRule(64, 64),
      new TierAuditRegionLengthRule(120),
      new TierAuditRatioRangeRule(5.4, 1778.4),
      new TierAuditOpenRateRangeRule(7.2, 1006.4),
      new TierAuditRequiredDescriptionRule("tier audit needs this field"),
    ],
  );
}
