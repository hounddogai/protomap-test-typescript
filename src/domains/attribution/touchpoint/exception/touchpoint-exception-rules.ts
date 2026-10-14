import { TouchpointException } from "./touchpoint-exception.js";

/** A rule a touchpoint exception must pass. Check returns its problems, or none. */
export interface TouchpointExceptionRule {
  check(item: TouchpointException): string[];
}

export class TouchpointExceptionCodeLengthRule implements TouchpointExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointExceptionSegmentLengthRule implements TouchpointExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointException): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointExceptionLabelLengthRule implements TouchpointExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointExceptionRequiredSegmentRule implements TouchpointExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointException): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint exception. */
export class TouchpointExceptionValidator {
  rules: TouchpointExceptionRule[];

  constructor(rules: TouchpointExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointException): string[] {
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

  requireValid(item: TouchpointException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointException[]): Map<string, string[]> {
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

export function defaultTouchpointExceptionValidator(): TouchpointExceptionValidator {
  return new TouchpointExceptionValidator(
    [
      new TouchpointExceptionCodeLengthRule(120),
      new TouchpointExceptionSegmentLengthRule(32),
      new TouchpointExceptionLabelLengthRule(120),
      new TouchpointExceptionRequiredSegmentRule("touchpoint exception needs an entry"),
    ],
  );
}
