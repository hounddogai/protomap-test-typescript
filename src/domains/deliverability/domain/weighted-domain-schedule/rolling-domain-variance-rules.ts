import { RollingDomainVariance } from "./rolling-domain-variance.js";

/** A rule a rolling domain variance must pass. Check returns its problems, or none. */
export interface RollingDomainVarianceRule {
  check(item: RollingDomainVariance): string[];
}

export class RollingDomainVarianceRequiredCodeRule implements RollingDomainVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingDomainVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingDomainVarianceRequiredJourneyIdRule implements RollingDomainVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingDomainVariance): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class RollingDomainVarianceRequiredNameRule implements RollingDomainVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingDomainVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingDomainVarianceImpressionsRangeRule implements RollingDomainVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingDomainVariance): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingDomainVarianceNameLengthRule implements RollingDomainVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingDomainVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingDomainVarianceCodeLengthRule implements RollingDomainVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingDomainVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling domain variance. */
export class RollingDomainVarianceValidator {
  rules: RollingDomainVarianceRule[];

  constructor(rules: RollingDomainVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingDomainVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingDomainVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingDomainVariance[]): Map<string, string[]> {
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

export function defaultRollingDomainVarianceValidator(): RollingDomainVarianceValidator {
  return new RollingDomainVarianceValidator(
    [
      new RollingDomainVarianceRequiredCodeRule("rolling domain variance needs this field"),
      new RollingDomainVarianceRequiredJourneyIdRule("rolling domain variance needs a value"),
      new RollingDomainVarianceRequiredNameRule("rolling domain variance needs this field"),
      new RollingDomainVarianceImpressionsRangeRule(16, 3600),
      new RollingDomainVarianceNameLengthRule(80),
      new RollingDomainVarianceCodeLengthRule(86400),
    ],
  );
}
