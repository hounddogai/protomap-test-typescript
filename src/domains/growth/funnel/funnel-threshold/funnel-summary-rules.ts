import { FunnelSummary } from "./funnel-summary.js";

/** A rule a funnel summary must pass. Check returns its problems, or none. */
export interface FunnelSummaryRule {
  check(item: FunnelSummary): string[];
}

export class FunnelSummaryCodeLengthRule implements FunnelSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelSummaryRequiredNameRule implements FunnelSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelSummaryRequiredContactEmailRule implements FunnelSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelSummary): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a funnel summary. */
export class FunnelSummaryValidator {
  rules: FunnelSummaryRule[];

  constructor(rules: FunnelSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelSummary): string[] {
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

  requireValid(item: FunnelSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelSummary[]): Map<string, string[]> {
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

export function defaultFunnelSummaryValidator(): FunnelSummaryValidator {
  return new FunnelSummaryValidator(
    [
      new FunnelSummaryCodeLengthRule(64),
      new FunnelSummaryRequiredNameRule("funnel summary needs a value"),
      new FunnelSummaryRequiredContactEmailRule("funnel summary needs a value"),
    ],
  );
}
