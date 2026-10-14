import { FlightOverride } from "./flight-override.js";

/** A rule a flight override must pass. Check returns its problems, or none. */
export interface FlightOverrideRule {
  check(item: FlightOverride): string[];
}

export class FlightOverrideRequiredTitleRule implements FlightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FlightOverrideCodeLengthRule implements FlightOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightOverrideTitleLengthRule implements FlightOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightOverrideRequiredCodeRule implements FlightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight override. */
export class FlightOverrideValidator {
  rules: FlightOverrideRule[];

  constructor(rules: FlightOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: FlightOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightOverride[]): Map<string, string[]> {
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

export function defaultFlightOverrideValidator(): FlightOverrideValidator {
  return new FlightOverrideValidator(
    [
      new FlightOverrideRequiredTitleRule("flight override needs a value"),
      new FlightOverrideCodeLengthRule(1000),
      new FlightOverrideTitleLengthRule(120),
      new FlightOverrideRequiredCodeRule("flight override needs this field"),
    ],
  );
}
