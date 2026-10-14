import { TieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

/** A rule a tiered touchpoint summary must pass. Check returns its problems, or none. */
export interface TieredTouchpointSummaryRule {
  check(item: TieredTouchpointSummary): string[];
}

export class TieredTouchpointSummaryRequiredExternalRefRule implements TieredTouchpointSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointSummary): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTouchpointSummaryLocaleLengthRule implements TieredTouchpointSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointSummary): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTouchpointSummaryRequiredNameRule implements TieredTouchpointSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTouchpointSummaryNameLengthRule implements TieredTouchpointSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered touchpoint summary. */
export class TieredTouchpointSummaryValidator {
  rules: TieredTouchpointSummaryRule[];

  constructor(rules: TieredTouchpointSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTouchpointSummary): string[] {
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

  requireValid(item: TieredTouchpointSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTouchpointSummary[]): Map<string, string[]> {
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

export function defaultTieredTouchpointSummaryValidator(): TieredTouchpointSummaryValidator {
  return new TieredTouchpointSummaryValidator(
    [
      new TieredTouchpointSummaryRequiredExternalRefRule("tiered touchpoint summary needs a value"),
      new TieredTouchpointSummaryLocaleLengthRule(32),
      new TieredTouchpointSummaryRequiredNameRule("tiered touchpoint summary needs a value"),
      new TieredTouchpointSummaryNameLengthRule(120),
    ],
  );
}
