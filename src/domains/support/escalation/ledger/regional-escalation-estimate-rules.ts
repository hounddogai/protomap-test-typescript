import { RegionalEscalationEstimate } from "./regional-escalation-estimate.js";

/** A rule a regional escalation estimate must pass. Check returns its problems, or none. */
export interface RegionalEscalationEstimateRule {
  check(item: RegionalEscalationEstimate): string[];
}

export class RegionalEscalationEstimateSendAtRangeRule implements RegionalEscalationEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalEscalationEstimate): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalEscalationEstimateRegionLengthRule implements RegionalEscalationEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalEscalationEstimate): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalEscalationEstimateRequiredRegionRule implements RegionalEscalationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEscalationEstimate): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalEscalationEstimateNameLengthRule implements RegionalEscalationEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalEscalationEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional escalation estimate. */
export class RegionalEscalationEstimateValidator {
  rules: RegionalEscalationEstimateRule[];

  constructor(rules: RegionalEscalationEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalEscalationEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalEscalationEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalEscalationEstimate[]): Map<string, string[]> {
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

export function defaultRegionalEscalationEstimateValidator(): RegionalEscalationEstimateValidator {
  return new RegionalEscalationEstimateValidator(
    [
      new RegionalEscalationEstimateSendAtRangeRule(16, 32),
      new RegionalEscalationEstimateRegionLengthRule(255),
      new RegionalEscalationEstimateRequiredRegionRule("regional escalation estimate needs an entry"),
      new RegionalEscalationEstimateNameLengthRule(3600),
    ],
  );
}
