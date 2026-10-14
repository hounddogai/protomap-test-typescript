import { DefaultPreferenceSegment } from "./default-preference-segment.js";

/** A rule a default preference segment must pass. Check returns its problems, or none. */
export interface DefaultPreferenceSegmentRule {
  check(item: DefaultPreferenceSegment): string[];
}

export class DefaultPreferenceSegmentCodePrefixRule implements DefaultPreferenceSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPreferenceSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultPreferenceSegmentCodeLengthRule implements DefaultPreferenceSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPreferenceSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPreferenceSegmentRequiredNameRule implements DefaultPreferenceSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPreferenceSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default preference segment. */
export class DefaultPreferenceSegmentValidator {
  rules: DefaultPreferenceSegmentRule[];

  constructor(rules: DefaultPreferenceSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPreferenceSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPreferenceSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPreferenceSegment[]): Map<string, string[]> {
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

export function defaultDefaultPreferenceSegmentValidator(): DefaultPreferenceSegmentValidator {
  return new DefaultPreferenceSegmentValidator(
    [
      new DefaultPreferenceSegmentCodePrefixRule("Q"),
      new DefaultPreferenceSegmentCodeLengthRule(16),
      new DefaultPreferenceSegmentRequiredNameRule("default preference segment needs an entry"),
    ],
  );
}
