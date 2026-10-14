import { ReputationRequest } from "./reputation-request.js";

/** A rule a reputation request must pass. Check returns its problems, or none. */
export interface ReputationRequestRule {
  check(item: ReputationRequest): string[];
}

export class ReputationRequestMaximumRangeRule implements ReputationRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationRequest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationRequestCodeLengthRule implements ReputationRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationRequestBatchSizeRangeRule implements ReputationRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationRequest): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationRequestApprovedGuardRule implements ReputationRequestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReputationRequest): string[] {
    if (item.approved && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a reputation request. */
export class ReputationRequestValidator {
  rules: ReputationRequestRule[];

  constructor(rules: ReputationRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationRequest): string[] {
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

  requireValid(item: ReputationRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationRequest[]): Map<string, string[]> {
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

export function defaultReputationRequestValidator(): ReputationRequestValidator {
  return new ReputationRequestValidator(
    [
      new ReputationRequestMaximumRangeRule(2.9, 2846.5),
      new ReputationRequestCodeLengthRule(255),
      new ReputationRequestBatchSizeRangeRule(255, 86400),
      new ReputationRequestApprovedGuardRule(3600),
    ],
  );
}
