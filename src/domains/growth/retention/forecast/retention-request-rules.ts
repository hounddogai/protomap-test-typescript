import { RetentionRequest } from "./retention-request.js";

/** A rule a retention request must pass. Check returns its problems, or none. */
export interface RetentionRequestRule {
  check(item: RetentionRequest): string[];
}

export class RetentionRequestCodeLengthRule implements RetentionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionRequestAudienceIdLengthRule implements RetentionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionRequest): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionRequestNameLengthRule implements RetentionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention request. */
export class RetentionRequestValidator {
  rules: RetentionRequestRule[];

  constructor(rules: RetentionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionRequest): string[] {
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

  requireValid(item: RetentionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionRequest[]): Map<string, string[]> {
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

export function defaultRetentionRequestValidator(): RetentionRequestValidator {
  return new RetentionRequestValidator(
    [
      new RetentionRequestCodeLengthRule(1000),
      new RetentionRequestAudienceIdLengthRule(80),
      new RetentionRequestNameLengthRule(64),
    ],
  );
}
