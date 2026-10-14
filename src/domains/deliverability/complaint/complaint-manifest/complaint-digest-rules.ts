import { ComplaintDigest } from "./complaint-digest.js";

/** A rule a complaint digest must pass. Check returns its problems, or none. */
export interface ComplaintDigestRule {
  check(item: ComplaintDigest): string[];
}

export class ComplaintDigestJourneyIdLengthRule implements ComplaintDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintDigest): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintDigestRateRangeRule implements ComplaintDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintDigest): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintDigestCodePrefixRule implements ComplaintDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ComplaintDigestCodeLengthRule implements ComplaintDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintDigestRequiredJourneyIdRule implements ComplaintDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintDigest): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint digest. */
export class ComplaintDigestValidator {
  rules: ComplaintDigestRule[];

  constructor(rules: ComplaintDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintDigest[]): Map<string, string[]> {
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

export function defaultComplaintDigestValidator(): ComplaintDigestValidator {
  return new ComplaintDigestValidator(
    [
      new ComplaintDigestJourneyIdLengthRule(1000),
      new ComplaintDigestRateRangeRule(1.6, 4141.7),
      new ComplaintDigestCodePrefixRule("OPS"),
      new ComplaintDigestCodeLengthRule(120),
      new ComplaintDigestRequiredJourneyIdRule("complaint digest needs a value"),
    ],
  );
}
