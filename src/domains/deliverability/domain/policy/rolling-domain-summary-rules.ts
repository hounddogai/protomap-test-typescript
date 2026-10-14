import { RollingDomainSummary } from "./rolling-domain-summary.js";

/** A rule a rolling domain summary must pass. Check returns its problems, or none. */
export interface RollingDomainSummaryRule {
  check(item: RollingDomainSummary): string[];
}

export class RollingDomainSummaryRequiredLabelRule implements RollingDomainSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingDomainSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingDomainSummaryRequiredCampaignRefRule implements RollingDomainSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingDomainSummary): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingDomainSummaryStartsAtRangeRule implements RollingDomainSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingDomainSummary): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingDomainSummaryCodeLengthRule implements RollingDomainSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingDomainSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling domain summary. */
export class RollingDomainSummaryValidator {
  rules: RollingDomainSummaryRule[];

  constructor(rules: RollingDomainSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RollingDomainSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingDomainSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingDomainSummary[]): Map<string, string[]> {
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

export function defaultRollingDomainSummaryValidator(): RollingDomainSummaryValidator {
  return new RollingDomainSummaryValidator(
    [
      new RollingDomainSummaryRequiredLabelRule("rolling domain summary needs an entry"),
      new RollingDomainSummaryRequiredCampaignRefRule("rolling domain summary needs a value"),
      new RollingDomainSummaryStartsAtRangeRule(16, 120),
      new RollingDomainSummaryCodeLengthRule(64),
    ],
  );
}
