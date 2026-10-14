import { DefaultFlightEntry } from "./default-flight-entry.js";

/** A rule a default flight entry must pass. Check returns its problems, or none. */
export interface DefaultFlightEntryRule {
  check(item: DefaultFlightEntry): string[];
}

export class DefaultFlightEntryCodePrefixRule implements DefaultFlightEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultFlightEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultFlightEntryTitleLengthRule implements DefaultFlightEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFlightEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFlightEntryRequiredCodeRule implements DefaultFlightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFlightEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFlightEntryRequiredRegionRule implements DefaultFlightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFlightEntry): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFlightEntryCodeLengthRule implements DefaultFlightEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFlightEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default flight entry. */
export class DefaultFlightEntryValidator {
  rules: DefaultFlightEntryRule[];

  constructor(rules: DefaultFlightEntryRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFlightEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultFlightEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFlightEntry[]): Map<string, string[]> {
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

export function defaultDefaultFlightEntryValidator(): DefaultFlightEntryValidator {
  return new DefaultFlightEntryValidator(
    [
      new DefaultFlightEntryCodePrefixRule("OPS"),
      new DefaultFlightEntryTitleLengthRule(3600),
      new DefaultFlightEntryRequiredCodeRule("default flight entry needs a value"),
      new DefaultFlightEntryRequiredRegionRule("default flight entry needs a value"),
      new DefaultFlightEntryCodeLengthRule(32),
    ],
  );
}
