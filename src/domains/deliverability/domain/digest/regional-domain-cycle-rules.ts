import { RegionalDomainCycle } from "./regional-domain-cycle.js";

/** A rule a regional domain cycle must pass. Check returns its problems, or none. */
export interface RegionalDomainCycleRule {
  check(item: RegionalDomainCycle): string[];
}

export class RegionalDomainCycleTitleLengthRule implements RegionalDomainCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDomainCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalDomainCycleRequiredCodeRule implements RegionalDomainCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDomainCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDomainCycleRevisionRangeRule implements RegionalDomainCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalDomainCycle): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalDomainCycleJourneyIdLengthRule implements RegionalDomainCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDomainCycle): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalDomainCycleCodeLengthRule implements RegionalDomainCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDomainCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalDomainCycleOpenRateRangeRule implements RegionalDomainCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalDomainCycle): string[] {
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

/** Runs every rule of a regional domain cycle. */
export class RegionalDomainCycleValidator {
  rules: RegionalDomainCycleRule[];

  constructor(rules: RegionalDomainCycleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalDomainCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalDomainCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalDomainCycle[]): Map<string, string[]> {
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

export function defaultRegionalDomainCycleValidator(): RegionalDomainCycleValidator {
  return new RegionalDomainCycleValidator(
    [
      new RegionalDomainCycleTitleLengthRule(255),
      new RegionalDomainCycleRequiredCodeRule("regional domain cycle needs an entry"),
      new RegionalDomainCycleRevisionRangeRule(120, 1000),
      new RegionalDomainCycleJourneyIdLengthRule(255),
      new RegionalDomainCycleCodeLengthRule(255),
      new RegionalDomainCycleOpenRateRangeRule(9.2, 4358.4),
    ],
  );
}
