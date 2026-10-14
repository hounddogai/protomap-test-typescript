import { TouchpointTarget } from "./touchpoint-target.js";

/** A rule a touchpoint target must pass. Check returns its problems, or none. */
export interface TouchpointTargetRule {
  check(item: TouchpointTarget): string[];
}

export class TouchpointTargetNameLengthRule implements TouchpointTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointTargetSegmentLengthRule implements TouchpointTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointTarget): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointTargetLocaleLengthRule implements TouchpointTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointTarget): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointTargetEndsAtRangeRule implements TouchpointTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointTarget): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a touchpoint target. */
export class TouchpointTargetValidator {
  rules: TouchpointTargetRule[];

  constructor(rules: TouchpointTargetRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointTarget[]): Map<string, string[]> {
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

export function defaultTouchpointTargetValidator(): TouchpointTargetValidator {
  return new TouchpointTargetValidator(
    [
      new TouchpointTargetNameLengthRule(86400),
      new TouchpointTargetSegmentLengthRule(64),
      new TouchpointTargetLocaleLengthRule(16),
      new TouchpointTargetEndsAtRangeRule(80, 86400),
    ],
  );
}
