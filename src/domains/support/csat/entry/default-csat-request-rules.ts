import { DefaultCsatRequest } from "./default-csat-request.js";

/** A rule a default csat request must pass. Check returns its problems, or none. */
export interface DefaultCsatRequestRule {
  check(item: DefaultCsatRequest): string[];
}

export class DefaultCsatRequestMinimumRangeRule implements DefaultCsatRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCsatRequest): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultCsatRequestRateRangeRule implements DefaultCsatRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCsatRequest): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultCsatRequestRequiredTitleRule implements DefaultCsatRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCsatRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultCsatRequestDurationMinutesRangeRule implements DefaultCsatRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCsatRequest): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultCsatRequestCampaignRefLengthRule implements DefaultCsatRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCsatRequest): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default csat request. */
export class DefaultCsatRequestValidator {
  rules: DefaultCsatRequestRule[];

  constructor(rules: DefaultCsatRequestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultCsatRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultCsatRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultCsatRequest[]): Map<string, string[]> {
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

export function defaultDefaultCsatRequestValidator(): DefaultCsatRequestValidator {
  return new DefaultCsatRequestValidator(
    [
      new DefaultCsatRequestMinimumRangeRule(1.2, 4428.8),
      new DefaultCsatRequestRateRangeRule(9.9, 2727.2),
      new DefaultCsatRequestRequiredTitleRule("default csat request needs this field"),
      new DefaultCsatRequestDurationMinutesRangeRule(255, 3600),
      new DefaultCsatRequestCampaignRefLengthRule(80),
    ],
  );
}
