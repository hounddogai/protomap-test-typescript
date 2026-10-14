import { ManualFlightCheckpoint } from "./manual-flight-checkpoint.js";

/** A rule a manual flight checkpoint must pass. Check returns its problems, or none. */
export interface ManualFlightCheckpointRule {
  check(item: ManualFlightCheckpoint): string[];
}

export class ManualFlightCheckpointRequiredContactEmailRule implements ManualFlightCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFlightCheckpoint): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFlightCheckpointDurationMinutesRangeRule implements ManualFlightCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFlightCheckpoint): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualFlightCheckpointCodePrefixRule implements ManualFlightCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualFlightCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualFlightCheckpointContactEmailLengthRule implements ManualFlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFlightCheckpoint): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFlightCheckpointTimezoneLengthRule implements ManualFlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFlightCheckpoint): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual flight checkpoint. */
export class ManualFlightCheckpointValidator {
  rules: ManualFlightCheckpointRule[];

  constructor(rules: ManualFlightCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFlightCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualFlightCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFlightCheckpoint[]): Map<string, string[]> {
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

export function defaultManualFlightCheckpointValidator(): ManualFlightCheckpointValidator {
  return new ManualFlightCheckpointValidator(
    [
      new ManualFlightCheckpointRequiredContactEmailRule("manual flight checkpoint needs a value"),
      new ManualFlightCheckpointDurationMinutesRangeRule(32, 86400),
      new ManualFlightCheckpointCodePrefixRule("OPS"),
      new ManualFlightCheckpointContactEmailLengthRule(3600),
      new ManualFlightCheckpointTimezoneLengthRule(80),
    ],
  );
}
