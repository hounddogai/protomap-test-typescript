import { DeflectionRecord } from "./deflection-record.js";

/** A rule a deflection record must pass. Check returns its problems, or none. */
export interface DeflectionRecordRule {
  check(item: DeflectionRecord): string[];
}

export class DeflectionRecordRequiredNameRule implements DeflectionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionRecordNameLengthRule implements DeflectionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionRecordCategoryLengthRule implements DeflectionRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionRecord): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionRecordCodePrefixRule implements DeflectionRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionRecordRequiredCategoryRule implements DeflectionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionRecord): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a deflection record. */
export class DeflectionRecordValidator {
  rules: DeflectionRecordRule[];

  constructor(rules: DeflectionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionRecord[]): Map<string, string[]> {
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

export function defaultDeflectionRecordValidator(): DeflectionRecordValidator {
  return new DeflectionRecordValidator(
    [
      new DeflectionRecordRequiredNameRule("deflection record needs an entry"),
      new DeflectionRecordNameLengthRule(80),
      new DeflectionRecordCategoryLengthRule(255),
      new DeflectionRecordCodePrefixRule("ACM"),
      new DeflectionRecordRequiredCategoryRule("deflection record needs an entry"),
    ],
  );
}
