import { PrimaryMacroEntry } from "./primary-macro-entry.js";

/** A rule a primary macro entry must pass. Check returns its problems, or none. */
export interface PrimaryMacroEntryRule {
  check(item: PrimaryMacroEntry): string[];
}

export class PrimaryMacroEntrySourceLengthRule implements PrimaryMacroEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMacroEntry): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryMacroEntryRequiredSourceRule implements PrimaryMacroEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroEntry): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryMacroEntryNameLengthRule implements PrimaryMacroEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMacroEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryMacroEntryRequiredTitleRule implements PrimaryMacroEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryMacroEntryCodePrefixRule implements PrimaryMacroEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryMacroEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary macro entry. */
export class PrimaryMacroEntryValidator {
  rules: PrimaryMacroEntryRule[];

  constructor(rules: PrimaryMacroEntryRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryMacroEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryMacroEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryMacroEntry[]): Map<string, string[]> {
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

export function defaultPrimaryMacroEntryValidator(): PrimaryMacroEntryValidator {
  return new PrimaryMacroEntryValidator(
    [
      new PrimaryMacroEntrySourceLengthRule(32),
      new PrimaryMacroEntryRequiredSourceRule("primary macro entry needs a value"),
      new PrimaryMacroEntryNameLengthRule(1000),
      new PrimaryMacroEntryRequiredTitleRule("primary macro entry needs a value"),
      new PrimaryMacroEntryCodePrefixRule("X"),
    ],
  );
}
