import { PrimaryFlightCheckpoint } from "./primary-flight-checkpoint.js";

/** A rule a primary flight checkpoint must pass. Check returns its problems, or none. */
export interface PrimaryFlightCheckpointRule {
  check(item: PrimaryFlightCheckpoint): string[];
}

export class PrimaryFlightCheckpointMaximumRangeRule implements PrimaryFlightCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFlightCheckpoint): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryFlightCheckpointRequiredCodeRule implements PrimaryFlightCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFlightCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFlightCheckpointNameLengthRule implements PrimaryFlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFlightCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFlightCheckpointCodePrefixRule implements PrimaryFlightCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryFlightCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryFlightCheckpointRequiredNameRule implements PrimaryFlightCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFlightCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary flight checkpoint. */
export class PrimaryFlightCheckpointValidator {
  rules: PrimaryFlightCheckpointRule[];

  constructor(rules: PrimaryFlightCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFlightCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryFlightCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFlightCheckpoint[]): Map<string, string[]> {
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

export function defaultPrimaryFlightCheckpointValidator(): PrimaryFlightCheckpointValidator {
  return new PrimaryFlightCheckpointValidator(
    [
      new PrimaryFlightCheckpointMaximumRangeRule(7.8, 3443.5),
      new PrimaryFlightCheckpointRequiredCodeRule("primary flight checkpoint needs a value"),
      new PrimaryFlightCheckpointNameLengthRule(16),
      new PrimaryFlightCheckpointCodePrefixRule("OPS"),
      new PrimaryFlightCheckpointRequiredNameRule("primary flight checkpoint needs this field"),
    ],
  );
}
