import { FlightQuota } from "./flight-quota.js";

/** A rule a flight quota must pass. Check returns its problems, or none. */
export interface FlightQuotaRule {
  check(item: FlightQuota): string[];
}

export class FlightQuotaRequiredNameRule implements FlightQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FlightQuotaCodeLengthRule implements FlightQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightQuotaRequiredTitleRule implements FlightQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FlightQuotaRequiredCodeRule implements FlightQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FlightQuotaSendAtRangeRule implements FlightQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightQuota): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FlightQuotaRequiredSegmentRule implements FlightQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightQuota): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight quota. */
export class FlightQuotaValidator {
  rules: FlightQuotaRule[];

  constructor(rules: FlightQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: FlightQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightQuota[]): Map<string, string[]> {
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

export function defaultFlightQuotaValidator(): FlightQuotaValidator {
  return new FlightQuotaValidator(
    [
      new FlightQuotaRequiredNameRule("flight quota needs this field"),
      new FlightQuotaCodeLengthRule(120),
      new FlightQuotaRequiredTitleRule("flight quota needs this field"),
      new FlightQuotaRequiredCodeRule("flight quota needs this field"),
      new FlightQuotaSendAtRangeRule(3600, 86400),
      new FlightQuotaRequiredSegmentRule("flight quota needs an entry"),
    ],
  );
}
