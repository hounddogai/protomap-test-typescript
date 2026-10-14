import { CreditSegment } from "./credit-segment.js";

/** A rule a credit segment must pass. Check returns its problems, or none. */
export interface CreditSegmentRule {
  check(item: CreditSegment): string[];
}

export class CreditSegmentAudienceIdLengthRule implements CreditSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSegment): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditSegmentRequiredCodeRule implements CreditSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditSegmentRequiredContactEmailRule implements CreditSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditSegment): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class CreditSegmentContactEmailLengthRule implements CreditSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSegment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditSegmentCodeLengthRule implements CreditSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit segment. */
export class CreditSegmentValidator {
  rules: CreditSegmentRule[];

  constructor(rules: CreditSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: CreditSegment): string[] {
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

  requireValid(item: CreditSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditSegment[]): Map<string, string[]> {
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

export function defaultCreditSegmentValidator(): CreditSegmentValidator {
  return new CreditSegmentValidator(
    [
      new CreditSegmentAudienceIdLengthRule(120),
      new CreditSegmentRequiredCodeRule("credit segment needs a value"),
      new CreditSegmentRequiredContactEmailRule("credit segment needs this field"),
      new CreditSegmentContactEmailLengthRule(3600),
      new CreditSegmentCodeLengthRule(1000),
    ],
  );
}
