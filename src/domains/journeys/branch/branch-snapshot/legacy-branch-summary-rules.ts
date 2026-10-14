import { LegacyBranchSummary } from "./legacy-branch-summary.js";

/** A rule a legacy branch summary must pass. Check returns its problems, or none. */
export interface LegacyBranchSummaryRule {
  check(item: LegacyBranchSummary): string[];
}

export class LegacyBranchSummaryRequiredChecksumRule implements LegacyBranchSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBranchSummary): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBranchSummaryRequiredTitleRule implements LegacyBranchSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBranchSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBranchSummaryRequiredLabelRule implements LegacyBranchSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBranchSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBranchSummaryChecksumLengthRule implements LegacyBranchSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBranchSummary): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBranchSummaryCodePrefixRule implements LegacyBranchSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyBranchSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy branch summary. */
export class LegacyBranchSummaryValidator {
  rules: LegacyBranchSummaryRule[];

  constructor(rules: LegacyBranchSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBranchSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyBranchSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBranchSummary[]): Map<string, string[]> {
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

export function defaultLegacyBranchSummaryValidator(): LegacyBranchSummaryValidator {
  return new LegacyBranchSummaryValidator(
    [
      new LegacyBranchSummaryRequiredChecksumRule("legacy branch summary needs an entry"),
      new LegacyBranchSummaryRequiredTitleRule("legacy branch summary needs a value"),
      new LegacyBranchSummaryRequiredLabelRule("legacy branch summary needs an entry"),
      new LegacyBranchSummaryChecksumLengthRule(1000),
      new LegacyBranchSummaryCodePrefixRule("OPS"),
    ],
  );
}
