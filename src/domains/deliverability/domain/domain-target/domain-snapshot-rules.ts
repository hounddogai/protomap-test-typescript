import { DomainSnapshot } from "./domain-snapshot.js";

/** A rule a domain snapshot must pass. Check returns its problems, or none. */
export interface DomainSnapshotRule {
  check(item: DomainSnapshot): string[];
}

export class DomainSnapshotRequiredCodeRule implements DomainSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainSnapshotLabelLengthRule implements DomainSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainSnapshotCodePrefixRule implements DomainSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a domain snapshot. */
export class DomainSnapshotValidator {
  rules: DomainSnapshotRule[];

  constructor(rules: DomainSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: DomainSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainSnapshot[]): Map<string, string[]> {
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

export function defaultDomainSnapshotValidator(): DomainSnapshotValidator {
  return new DomainSnapshotValidator(
    [
      new DomainSnapshotRequiredCodeRule("domain snapshot needs a value"),
      new DomainSnapshotLabelLengthRule(16),
      new DomainSnapshotCodePrefixRule("X"),
    ],
  );
}
