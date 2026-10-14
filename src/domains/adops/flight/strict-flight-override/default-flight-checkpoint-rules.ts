import { DefaultFlightCheckpoint } from "./default-flight-checkpoint.js";

/** A rule a default flight checkpoint must pass. Check returns its problems, or none. */
export interface DefaultFlightCheckpointRule {
  check(item: DefaultFlightCheckpoint): string[];
}

export class DefaultFlightCheckpointCodePrefixRule implements DefaultFlightCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultFlightCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultFlightCheckpointTitleLengthRule implements DefaultFlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFlightCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFlightCheckpointCodeLengthRule implements DefaultFlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFlightCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFlightCheckpointMarginRangeRule implements DefaultFlightCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFlightCheckpoint): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default flight checkpoint. */
export class DefaultFlightCheckpointValidator {
  rules: DefaultFlightCheckpointRule[];

  constructor(rules: DefaultFlightCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFlightCheckpoint): string[] {
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

  requireValid(item: DefaultFlightCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFlightCheckpoint[]): Map<string, string[]> {
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

export function defaultDefaultFlightCheckpointValidator(): DefaultFlightCheckpointValidator {
  return new DefaultFlightCheckpointValidator(
    [
      new DefaultFlightCheckpointCodePrefixRule("Q"),
      new DefaultFlightCheckpointTitleLengthRule(1000),
      new DefaultFlightCheckpointCodeLengthRule(64),
      new DefaultFlightCheckpointMarginRangeRule(6.2, 2796.3),
    ],
  );
}
