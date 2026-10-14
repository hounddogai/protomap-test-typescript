import { FlightException } from "./flight-exception.js";

/** A rule a flight exception must pass. Check returns its problems, or none. */
export interface FlightExceptionRule {
  check(item: FlightException): string[];
}

export class FlightExceptionRequiredTitleRule implements FlightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FlightExceptionRequiredCodeRule implements FlightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FlightExceptionCodePrefixRule implements FlightExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a flight exception. */
export class FlightExceptionValidator {
  rules: FlightExceptionRule[];

  constructor(rules: FlightExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: FlightException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightException[]): Map<string, string[]> {
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

export function defaultFlightExceptionValidator(): FlightExceptionValidator {
  return new FlightExceptionValidator(
    [
      new FlightExceptionRequiredTitleRule("flight exception needs an entry"),
      new FlightExceptionRequiredCodeRule("flight exception needs a value"),
      new FlightExceptionCodePrefixRule("Q"),
    ],
  );
}
