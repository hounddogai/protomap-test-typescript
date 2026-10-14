import { InsightEntry } from "./insight-entry.js";

/** A rule a insight entry must pass. Check returns its problems, or none. */
export interface InsightEntryRule {
  check(item: InsightEntry): string[];
}

export class InsightEntryVariantLengthRule implements InsightEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightEntry): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightEntryRequiredNameRule implements InsightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class InsightEntryCodePrefixRule implements InsightEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a insight entry. */
export class InsightEntryValidator {
  rules: InsightEntryRule[];

  constructor(rules: InsightEntryRule[]) {
    this.rules = rules;
  }

  validate(item: InsightEntry): string[] {
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

  requireValid(item: InsightEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightEntry[]): Map<string, string[]> {
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

export function defaultInsightEntryValidator(): InsightEntryValidator {
  return new InsightEntryValidator(
    [
      new InsightEntryVariantLengthRule(32),
      new InsightEntryRequiredNameRule("insight entry needs an entry"),
      new InsightEntryCodePrefixRule("ACM"),
    ],
  );
}
