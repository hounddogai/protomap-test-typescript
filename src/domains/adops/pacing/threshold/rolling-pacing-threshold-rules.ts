import { RollingPacingThreshold } from "./rolling-pacing-threshold.js";

/** A rule a rolling pacing threshold must pass. Check returns its problems, or none. */
export interface RollingPacingThresholdRule {
  check(item: RollingPacingThreshold): string[];
}

export class RollingPacingThresholdCodePrefixRule implements RollingPacingThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingPacingThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingPacingThresholdUnitLengthRule implements RollingPacingThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingThreshold): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPacingThresholdRequiredCodeRule implements RollingPacingThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPacingThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPacingThresholdRequiredUnitRule implements RollingPacingThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPacingThreshold): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPacingThresholdDurationMinutesRangeRule implements RollingPacingThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPacingThreshold): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling pacing threshold. */
export class RollingPacingThresholdValidator {
  rules: RollingPacingThresholdRule[];

  constructor(rules: RollingPacingThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPacingThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPacingThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPacingThreshold[]): Map<string, string[]> {
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

export function defaultRollingPacingThresholdValidator(): RollingPacingThresholdValidator {
  return new RollingPacingThresholdValidator(
    [
      new RollingPacingThresholdCodePrefixRule("REF"),
      new RollingPacingThresholdUnitLengthRule(3600),
      new RollingPacingThresholdRequiredCodeRule("rolling pacing threshold needs this field"),
      new RollingPacingThresholdRequiredUnitRule("rolling pacing threshold needs a value"),
      new RollingPacingThresholdDurationMinutesRangeRule(255, 3600),
    ],
  );
}
