import { FlightCheckpoint } from "./flight-checkpoint.js";

/** A rule a flight checkpoint must pass. Check returns its problems, or none. */
export interface FlightCheckpointRule {
  check(item: FlightCheckpoint): string[];
}

export class FlightCheckpointRequiredLabelRule implements FlightCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FlightCheckpointChannelLengthRule implements FlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightCheckpoint): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightCheckpointCodeLengthRule implements FlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightCheckpointLabelLengthRule implements FlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a flight checkpoint. */
export class FlightCheckpointValidator {
  rules: FlightCheckpointRule[];

  constructor(rules: FlightCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: FlightCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightCheckpoint[]): Map<string, string[]> {
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

export function defaultFlightCheckpointValidator(): FlightCheckpointValidator {
  return new FlightCheckpointValidator(
    [
      new FlightCheckpointRequiredLabelRule("flight checkpoint needs a value"),
      new FlightCheckpointChannelLengthRule(64),
      new FlightCheckpointCodeLengthRule(32),
      new FlightCheckpointLabelLengthRule(1000),
    ],
  );
}
