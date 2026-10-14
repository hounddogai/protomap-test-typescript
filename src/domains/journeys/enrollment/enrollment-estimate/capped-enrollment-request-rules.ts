import { CappedEnrollmentRequest } from "./capped-enrollment-request.js";

/** A rule a capped enrollment request must pass. Check returns its problems, or none. */
export interface CappedEnrollmentRequestRule {
  check(item: CappedEnrollmentRequest): string[];
}

export class CappedEnrollmentRequestNameLengthRule implements CappedEnrollmentRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedEnrollmentRequestRequiredUtmSourceRule implements CappedEnrollmentRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedEnrollmentRequest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class CappedEnrollmentRequestTitleLengthRule implements CappedEnrollmentRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedEnrollmentRequestDiscountRangeRule implements CappedEnrollmentRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedEnrollmentRequest): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedEnrollmentRequestCodeLengthRule implements CappedEnrollmentRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped enrollment request. */
export class CappedEnrollmentRequestValidator {
  rules: CappedEnrollmentRequestRule[];

  constructor(rules: CappedEnrollmentRequestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedEnrollmentRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedEnrollmentRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedEnrollmentRequest[]): Map<string, string[]> {
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

export function defaultCappedEnrollmentRequestValidator(): CappedEnrollmentRequestValidator {
  return new CappedEnrollmentRequestValidator(
    [
      new CappedEnrollmentRequestNameLengthRule(120),
      new CappedEnrollmentRequestRequiredUtmSourceRule("capped enrollment request needs a value"),
      new CappedEnrollmentRequestTitleLengthRule(64),
      new CappedEnrollmentRequestDiscountRangeRule(5.5, 4443.7),
      new CappedEnrollmentRequestCodeLengthRule(80),
    ],
  );
}
