import { RollingCreativeSummary } from "./rolling-creative-summary.js";

/** A rule a rolling creative summary must pass. Check returns its problems, or none. */
export interface RollingCreativeSummaryRule {
  check(item: RollingCreativeSummary): string[];
}

export class RollingCreativeSummaryRequiredTimezoneRule implements RollingCreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCreativeSummary): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCreativeSummaryCodePrefixRule implements RollingCreativeSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingCreativeSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingCreativeSummaryRequiredCodeRule implements RollingCreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCreativeSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCreativeSummaryTitleLengthRule implements RollingCreativeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCreativeSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling creative summary. */
export class RollingCreativeSummaryValidator {
  rules: RollingCreativeSummaryRule[];

  constructor(rules: RollingCreativeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCreativeSummary): string[] {
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

  requireValid(item: RollingCreativeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCreativeSummary[]): Map<string, string[]> {
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

export function defaultRollingCreativeSummaryValidator(): RollingCreativeSummaryValidator {
  return new RollingCreativeSummaryValidator(
    [
      new RollingCreativeSummaryRequiredTimezoneRule("rolling creative summary needs a value"),
      new RollingCreativeSummaryCodePrefixRule("Q"),
      new RollingCreativeSummaryRequiredCodeRule("rolling creative summary needs an entry"),
      new RollingCreativeSummaryTitleLengthRule(3600),
    ],
  );
}
