import { TouchpointRequest } from "./touchpoint-request.js";

/** A rule a touchpoint request must pass. Check returns its problems, or none. */
export interface TouchpointRequestRule {
  check(item: TouchpointRequest): string[];
}

export class TouchpointRequestNameLengthRule implements TouchpointRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointRequestRequiredCohortRule implements TouchpointRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointRequest): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointRequestSequenceRangeRule implements TouchpointRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointRequest): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a touchpoint request. */
export class TouchpointRequestValidator {
  rules: TouchpointRequestRule[];

  constructor(rules: TouchpointRequestRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointRequest): string[] {
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

  requireValid(item: TouchpointRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointRequest[]): Map<string, string[]> {
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

export function defaultTouchpointRequestValidator(): TouchpointRequestValidator {
  return new TouchpointRequestValidator(
    [
      new TouchpointRequestNameLengthRule(80),
      new TouchpointRequestRequiredCohortRule("touchpoint request needs this field"),
      new TouchpointRequestSequenceRangeRule(32, 3600),
    ],
  );
}
