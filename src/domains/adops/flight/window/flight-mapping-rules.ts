import { FlightMapping } from "./flight-mapping.js";

/** A rule a flight mapping must pass. Check returns its problems, or none. */
export interface FlightMappingRule {
  check(item: FlightMapping): string[];
}

export class FlightMappingCodePrefixRule implements FlightMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FlightMappingRequiredCodeRule implements FlightMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FlightMappingNameLengthRule implements FlightMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightMappingSequenceRangeRule implements FlightMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightMapping): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FlightMappingExternalRefLengthRule implements FlightMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightMapping): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a flight mapping. */
export class FlightMappingValidator {
  rules: FlightMappingRule[];

  constructor(rules: FlightMappingRule[]) {
    this.rules = rules;
  }

  validate(item: FlightMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightMapping[]): Map<string, string[]> {
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

export function defaultFlightMappingValidator(): FlightMappingValidator {
  return new FlightMappingValidator(
    [
      new FlightMappingCodePrefixRule("ACM"),
      new FlightMappingRequiredCodeRule("flight mapping needs this field"),
      new FlightMappingNameLengthRule(3600),
      new FlightMappingSequenceRangeRule(80, 86400),
      new FlightMappingExternalRefLengthRule(255),
    ],
  );
}
