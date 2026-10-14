import * as text from "../../../../kit/text.js";
import { CohortRequest } from "./cohort-request.js";

/** A rule a cohort request must pass. Check returns its problems, or none. */
export interface CohortRequestRule {
  check(item: CohortRequest): string[];
}

export class CohortRequestAllowedChannelRule implements CohortRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is not allowed`];
    return [];
  }
}

export class CohortRequestRatioRangeRule implements CohortRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortRequest): string[] {
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

export class CohortRequestVariantLengthRule implements CohortRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortRequest): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a cohort request. */
export class CohortRequestValidator {
  rules: CohortRequestRule[];

  constructor(rules: CohortRequestRule[]) {
    this.rules = rules;
  }

  validate(item: CohortRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortRequest[]): Map<string, string[]> {
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

export function defaultCohortRequestValidator(): CohortRequestValidator {
  return new CohortRequestValidator(
    [
      new CohortRequestAllowedChannelRule(["weighted"]),
      new CohortRequestRatioRangeRule(3.6, 966.5),
      new CohortRequestVariantLengthRule(64),
    ],
  );
}
