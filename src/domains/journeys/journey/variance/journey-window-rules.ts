import { JourneyWindow } from "./journey-window.js";

/** A rule a journey window must pass. Check returns its problems, or none. */
export interface JourneyWindowRule {
  check(item: JourneyWindow): string[];
}

export class JourneyWindowRequiredUnitRule implements JourneyWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyWindow): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyWindowNameLengthRule implements JourneyWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyWindowCodePrefixRule implements JourneyWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a journey window. */
export class JourneyWindowValidator {
  rules: JourneyWindowRule[];

  constructor(rules: JourneyWindowRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyWindow[]): Map<string, string[]> {
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

export function defaultJourneyWindowValidator(): JourneyWindowValidator {
  return new JourneyWindowValidator(
    [
      new JourneyWindowRequiredUnitRule("journey window needs a value"),
      new JourneyWindowNameLengthRule(1000),
      new JourneyWindowCodePrefixRule("OPS"),
    ],
  );
}
