import { JourneyEntry } from "./journey-entry.js";

/** A rule a journey entry must pass. Check returns its problems, or none. */
export interface JourneyEntryRule {
  check(item: JourneyEntry): string[];
}

export class JourneyEntrySegmentLengthRule implements JourneyEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyEntry): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyEntryRequiredSegmentRule implements JourneyEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyEntry): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyEntryLabelLengthRule implements JourneyEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyEntryScoreRangeRule implements JourneyEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyEntry): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyEntryCodePrefixRule implements JourneyEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class JourneyEntryPinnedGuardRule implements JourneyEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: JourneyEntry): string[] {
    if (item.pinned && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a journey entry. */
export class JourneyEntryValidator {
  rules: JourneyEntryRule[];

  constructor(rules: JourneyEntryRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyEntry[]): Map<string, string[]> {
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

export function defaultJourneyEntryValidator(): JourneyEntryValidator {
  return new JourneyEntryValidator(
    [
      new JourneyEntrySegmentLengthRule(1000),
      new JourneyEntryRequiredSegmentRule("journey entry needs a value"),
      new JourneyEntryLabelLengthRule(80),
      new JourneyEntryScoreRangeRule(2.4, 1760.8),
      new JourneyEntryCodePrefixRule("OPS"),
      new JourneyEntryPinnedGuardRule(86400),
    ],
  );
}
