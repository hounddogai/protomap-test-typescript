import { RollingStepRequest } from "./rolling-step-request.js";

/** A rule a rolling step request must pass. Check returns its problems, or none. */
export interface RollingStepRequestRule {
  check(item: RollingStepRequest): string[];
}

export class RollingStepRequestCodePrefixRule implements RollingStepRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingStepRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingStepRequestNameLengthRule implements RollingStepRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingStepRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingStepRequestVersionRangeRule implements RollingStepRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingStepRequest): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling step request. */
export class RollingStepRequestValidator {
  rules: RollingStepRequestRule[];

  constructor(rules: RollingStepRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RollingStepRequest): string[] {
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

  requireValid(item: RollingStepRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingStepRequest[]): Map<string, string[]> {
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

export function defaultRollingStepRequestValidator(): RollingStepRequestValidator {
  return new RollingStepRequestValidator(
    [
      new RollingStepRequestCodePrefixRule("X"),
      new RollingStepRequestNameLengthRule(80),
      new RollingStepRequestVersionRangeRule(32, 1000),
    ],
  );
}
