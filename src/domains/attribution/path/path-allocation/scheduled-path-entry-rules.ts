import { ScheduledPathEntry } from "./scheduled-path-entry.js";

/** A rule a scheduled path entry must pass. Check returns its problems, or none. */
export interface ScheduledPathEntryRule {
  check(item: ScheduledPathEntry): string[];
}

export class ScheduledPathEntryCodeLengthRule implements ScheduledPathEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPathEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPathEntryRequiredNameRule implements ScheduledPathEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPathEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPathEntryRequiredLabelRule implements ScheduledPathEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPathEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPathEntryCodePrefixRule implements ScheduledPathEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPathEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled path entry. */
export class ScheduledPathEntryValidator {
  rules: ScheduledPathEntryRule[];

  constructor(rules: ScheduledPathEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPathEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPathEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPathEntry[]): Map<string, string[]> {
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

export function defaultScheduledPathEntryValidator(): ScheduledPathEntryValidator {
  return new ScheduledPathEntryValidator(
    [
      new ScheduledPathEntryCodeLengthRule(86400),
      new ScheduledPathEntryRequiredNameRule("scheduled path entry needs this field"),
      new ScheduledPathEntryRequiredLabelRule("scheduled path entry needs an entry"),
      new ScheduledPathEntryCodePrefixRule("ACM"),
    ],
  );
}
