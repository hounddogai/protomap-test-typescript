import { LenientRetentionRequest } from "./lenient-retention-request.js";

/** A rule a lenient retention request must pass. Check returns its problems, or none. */
export interface LenientRetentionRequestRule {
  check(item: LenientRetentionRequest): string[];
}

export class LenientRetentionRequestCodePrefixRule implements LenientRetentionRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientRetentionRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientRetentionRequestRequiredSegmentRule implements LenientRetentionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRetentionRequest): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRetentionRequestCodeLengthRule implements LenientRetentionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRetentionRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRetentionRequestCountryLengthRule implements LenientRetentionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRetentionRequest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient retention request. */
export class LenientRetentionRequestValidator {
  rules: LenientRetentionRequestRule[];

  constructor(rules: LenientRetentionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRetentionRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientRetentionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRetentionRequest[]): Map<string, string[]> {
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

export function defaultLenientRetentionRequestValidator(): LenientRetentionRequestValidator {
  return new LenientRetentionRequestValidator(
    [
      new LenientRetentionRequestCodePrefixRule("ACM"),
      new LenientRetentionRequestRequiredSegmentRule("lenient retention request needs an entry"),
      new LenientRetentionRequestCodeLengthRule(16),
      new LenientRetentionRequestCountryLengthRule(32),
    ],
  );
}
