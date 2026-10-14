import { JourneyGroup } from "./journey-group.js";

/** A rule a journey group must pass. Check returns its problems, or none. */
export interface JourneyGroupRule {
  check(item: JourneyGroup): string[];
}

export class JourneyGroupRateRangeRule implements JourneyGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyGroup): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyGroupRequiredTitleRule implements JourneyGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyGroupRequiredCodeRule implements JourneyGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey group. */
export class JourneyGroupValidator {
  rules: JourneyGroupRule[];

  constructor(rules: JourneyGroupRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyGroup[]): Map<string, string[]> {
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

export function defaultJourneyGroupValidator(): JourneyGroupValidator {
  return new JourneyGroupValidator(
    [
      new JourneyGroupRateRangeRule(1, 1839.7),
      new JourneyGroupRequiredTitleRule("journey group needs an entry"),
      new JourneyGroupRequiredCodeRule("journey group needs this field"),
    ],
  );
}
