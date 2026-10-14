import { EnrollmentEntry } from "./enrollment-entry.js";

/** A rule a enrollment entry must pass. Check returns its problems, or none. */
export interface EnrollmentEntryRule {
  check(item: EnrollmentEntry): string[];
}

export class EnrollmentEntryRequiredExternalRefRule implements EnrollmentEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentEntry): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentEntryContactEmailLengthRule implements EnrollmentEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentEntry): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentEntryCapacityRangeRule implements EnrollmentEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentEntry): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentEntryNameLengthRule implements EnrollmentEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentEntryCodePrefixRule implements EnrollmentEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a enrollment entry. */
export class EnrollmentEntryValidator {
  rules: EnrollmentEntryRule[];

  constructor(rules: EnrollmentEntryRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentEntry[]): Map<string, string[]> {
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

export function defaultEnrollmentEntryValidator(): EnrollmentEntryValidator {
  return new EnrollmentEntryValidator(
    [
      new EnrollmentEntryRequiredExternalRefRule("enrollment entry needs this field"),
      new EnrollmentEntryContactEmailLengthRule(3600),
      new EnrollmentEntryCapacityRangeRule(255, 1000),
      new EnrollmentEntryNameLengthRule(120),
      new EnrollmentEntryCodePrefixRule("X"),
    ],
  );
}
