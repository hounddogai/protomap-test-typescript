import { TieredBadgeSummary } from "./tiered-badge-summary.js";

/** A rule a tiered badge summary must pass. Check returns its problems, or none. */
export interface TieredBadgeSummaryRule {
  check(item: TieredBadgeSummary): string[];
}

export class TieredBadgeSummaryCodePrefixRule implements TieredBadgeSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredBadgeSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredBadgeSummaryRequiredCodeRule implements TieredBadgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBadgeSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBadgeSummaryAudienceIdLengthRule implements TieredBadgeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBadgeSummary): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBadgeSummaryTitleLengthRule implements TieredBadgeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBadgeSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered badge summary. */
export class TieredBadgeSummaryValidator {
  rules: TieredBadgeSummaryRule[];

  constructor(rules: TieredBadgeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBadgeSummary): string[] {
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

  requireValid(item: TieredBadgeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBadgeSummary[]): Map<string, string[]> {
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

export function defaultTieredBadgeSummaryValidator(): TieredBadgeSummaryValidator {
  return new TieredBadgeSummaryValidator(
    [
      new TieredBadgeSummaryCodePrefixRule("REF"),
      new TieredBadgeSummaryRequiredCodeRule("tiered badge summary needs a value"),
      new TieredBadgeSummaryAudienceIdLengthRule(120),
      new TieredBadgeSummaryTitleLengthRule(80),
    ],
  );
}
