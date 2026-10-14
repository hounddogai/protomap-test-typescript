import { PacingSummary } from "./pacing-summary.js";

/** A rule a pacing summary must pass. Check returns its problems, or none. */
export interface PacingSummaryRule {
  check(item: PacingSummary): string[];
}

export class PacingSummaryNameLengthRule implements PacingSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingSummaryRequiredCodeRule implements PacingSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PacingSummaryCodePrefixRule implements PacingSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingSummaryRequiredChecksumRule implements PacingSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingSummary): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class PacingSummaryChecksumLengthRule implements PacingSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingSummary): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing summary. */
export class PacingSummaryValidator {
  rules: PacingSummaryRule[];

  constructor(rules: PacingSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PacingSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: PacingSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingSummary[]): Map<string, string[]> {
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

export function defaultPacingSummaryValidator(): PacingSummaryValidator {
  return new PacingSummaryValidator(
    [
      new PacingSummaryNameLengthRule(32),
      new PacingSummaryRequiredCodeRule("pacing summary needs an entry"),
      new PacingSummaryCodePrefixRule("ACM"),
      new PacingSummaryRequiredChecksumRule("pacing summary needs this field"),
      new PacingSummaryChecksumLengthRule(86400),
    ],
  );
}
