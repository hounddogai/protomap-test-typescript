import { LegacyPacingThreshold } from "./legacy-pacing-threshold.js";

/** A rule a legacy pacing threshold must pass. Check returns its problems, or none. */
export interface LegacyPacingThresholdRule {
  check(item: LegacyPacingThreshold): string[];
}

export class LegacyPacingThresholdRequiredNameRule implements LegacyPacingThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPacingThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPacingThresholdNameLengthRule implements LegacyPacingThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPacingThresholdCeilingRangeRule implements LegacyPacingThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPacingThreshold): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyPacingThresholdCodeLengthRule implements LegacyPacingThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy pacing threshold. */
export class LegacyPacingThresholdValidator {
  rules: LegacyPacingThresholdRule[];

  constructor(rules: LegacyPacingThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPacingThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPacingThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPacingThreshold[]): Map<string, string[]> {
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

export function defaultLegacyPacingThresholdValidator(): LegacyPacingThresholdValidator {
  return new LegacyPacingThresholdValidator(
    [
      new LegacyPacingThresholdRequiredNameRule("legacy pacing threshold needs this field"),
      new LegacyPacingThresholdNameLengthRule(86400),
      new LegacyPacingThresholdCeilingRangeRule(7.7, 4263.2),
      new LegacyPacingThresholdCodeLengthRule(1000),
    ],
  );
}
