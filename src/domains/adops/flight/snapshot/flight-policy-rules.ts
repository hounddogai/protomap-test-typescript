import { FlightPolicy } from "./flight-policy.js";

/** A rule a flight policy must pass. Check returns its problems, or none. */
export interface FlightPolicyRule {
  check(item: FlightPolicy): string[];
}

export class FlightPolicyThresholdRangeRule implements FlightPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightPolicy): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FlightPolicyRequiredChannelRule implements FlightPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightPolicy): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class FlightPolicyRequiredTitleRule implements FlightPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FlightPolicyRequiredCodeRule implements FlightPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight policy. */
export class FlightPolicyValidator {
  rules: FlightPolicyRule[];

  constructor(rules: FlightPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: FlightPolicy): string[] {
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

  requireValid(item: FlightPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightPolicy[]): Map<string, string[]> {
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

export function defaultFlightPolicyValidator(): FlightPolicyValidator {
  return new FlightPolicyValidator(
    [
      new FlightPolicyThresholdRangeRule(0.1, 3746),
      new FlightPolicyRequiredChannelRule("flight policy needs an entry"),
      new FlightPolicyRequiredTitleRule("flight policy needs a value"),
      new FlightPolicyRequiredCodeRule("flight policy needs this field"),
    ],
  );
}
