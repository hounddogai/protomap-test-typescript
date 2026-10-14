import { TouchpointRecord } from "./touchpoint-record.js";

/** A rule a touchpoint record must pass. Check returns its problems, or none. */
export interface TouchpointRecordRule {
  check(item: TouchpointRecord): string[];
}

export class TouchpointRecordCodeLengthRule implements TouchpointRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointRecordAttemptsRangeRule implements TouchpointRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointRecord): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointRecordCodePrefixRule implements TouchpointRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TouchpointRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TouchpointRecordTimezoneLengthRule implements TouchpointRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointRecord): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a touchpoint record. */
export class TouchpointRecordValidator {
  rules: TouchpointRecordRule[];

  constructor(rules: TouchpointRecordRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointRecord[]): Map<string, string[]> {
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

export function defaultTouchpointRecordValidator(): TouchpointRecordValidator {
  return new TouchpointRecordValidator(
    [
      new TouchpointRecordCodeLengthRule(1000),
      new TouchpointRecordAttemptsRangeRule(80, 86400),
      new TouchpointRecordCodePrefixRule("OPS"),
      new TouchpointRecordTimezoneLengthRule(80),
    ],
  );
}
