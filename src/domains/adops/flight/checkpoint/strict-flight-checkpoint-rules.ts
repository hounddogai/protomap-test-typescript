import { StrictFlightCheckpoint } from "./strict-flight-checkpoint.js";

/** A rule a strict flight checkpoint must pass. Check returns its problems, or none. */
export interface StrictFlightCheckpointRule {
  check(item: StrictFlightCheckpoint): string[];
}

export class StrictFlightCheckpointCountryLengthRule implements StrictFlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFlightCheckpoint): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictFlightCheckpointWindowRule implements StrictFlightCheckpointRule {
  maxSpan: number;

  constructor(maxSpan: number) {
    this.maxSpan = maxSpan;
  }

  check(item: StrictFlightCheckpoint): string[] {
    if (item.startsAt > item.endsAt) return ["starts at is after ends at"];
    if (this.maxSpan > 0 && item.endsAt - item.startsAt > this.maxSpan) return [`spans more than ${this.maxSpan} seconds`];
    return [];
  }
}

export class StrictFlightCheckpointCodePrefixRule implements StrictFlightCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictFlightCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictFlightCheckpointRequiredCodeRule implements StrictFlightCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictFlightCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictFlightCheckpointCodeLengthRule implements StrictFlightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFlightCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict flight checkpoint. */
export class StrictFlightCheckpointValidator {
  rules: StrictFlightCheckpointRule[];

  constructor(rules: StrictFlightCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: StrictFlightCheckpoint): string[] {
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

  requireValid(item: StrictFlightCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictFlightCheckpoint[]): Map<string, string[]> {
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

export function defaultStrictFlightCheckpointValidator(): StrictFlightCheckpointValidator {
  return new StrictFlightCheckpointValidator(
    [
      new StrictFlightCheckpointCountryLengthRule(64),
      new StrictFlightCheckpointWindowRule(80),
      new StrictFlightCheckpointCodePrefixRule("ACM"),
      new StrictFlightCheckpointRequiredCodeRule("strict flight checkpoint needs an entry"),
      new StrictFlightCheckpointCodeLengthRule(1000),
    ],
  );
}
