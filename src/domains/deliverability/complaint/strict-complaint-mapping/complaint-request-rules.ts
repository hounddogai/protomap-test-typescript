import { ComplaintRequest } from "./complaint-request.js";

/** A rule a complaint request must pass. Check returns its problems, or none. */
export interface ComplaintRequestRule {
  check(item: ComplaintRequest): string[];
}

export class ComplaintRequestClicksRangeRule implements ComplaintRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintRequest): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintRequestCampaignRefLengthRule implements ComplaintRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintRequest): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintRequestRequiredCohortRule implements ComplaintRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintRequest): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint request. */
export class ComplaintRequestValidator {
  rules: ComplaintRequestRule[];

  constructor(rules: ComplaintRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintRequest): string[] {
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

  requireValid(item: ComplaintRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintRequest[]): Map<string, string[]> {
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

export function defaultComplaintRequestValidator(): ComplaintRequestValidator {
  return new ComplaintRequestValidator(
    [
      new ComplaintRequestClicksRangeRule(80, 1000),
      new ComplaintRequestCampaignRefLengthRule(255),
      new ComplaintRequestRequiredCohortRule("complaint request needs this field"),
    ],
  );
}
