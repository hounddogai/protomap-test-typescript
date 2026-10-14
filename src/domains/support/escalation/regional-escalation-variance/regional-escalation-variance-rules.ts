import { RegionalEscalationVariance } from "./regional-escalation-variance.js";

/** A rule a regional escalation variance must pass. Check returns its problems, or none. */
export interface RegionalEscalationVarianceRule {
  check(item: RegionalEscalationVariance): string[];
}

export class RegionalEscalationVarianceRequiredNameRule implements RegionalEscalationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEscalationVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalEscalationVarianceCreatedAtRangeRule implements RegionalEscalationVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalEscalationVariance): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalEscalationVarianceRequiredCodeRule implements RegionalEscalationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEscalationVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalEscalationVarianceRequiredJourneyIdRule implements RegionalEscalationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEscalationVariance): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional escalation variance. */
export class RegionalEscalationVarianceValidator {
  rules: RegionalEscalationVarianceRule[];

  constructor(rules: RegionalEscalationVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalEscalationVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalEscalationVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalEscalationVariance[]): Map<string, string[]> {
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

export function defaultRegionalEscalationVarianceValidator(): RegionalEscalationVarianceValidator {
  return new RegionalEscalationVarianceValidator(
    [
      new RegionalEscalationVarianceRequiredNameRule("regional escalation variance needs a value"),
      new RegionalEscalationVarianceCreatedAtRangeRule(255, 86400),
      new RegionalEscalationVarianceRequiredCodeRule("regional escalation variance needs an entry"),
      new RegionalEscalationVarianceRequiredJourneyIdRule("regional escalation variance needs an entry"),
    ],
  );
}
