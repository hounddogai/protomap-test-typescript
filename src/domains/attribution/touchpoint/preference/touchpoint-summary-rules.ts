import * as text from "../../../../kit/text.js";
import { TouchpointSummary } from "./touchpoint-summary.js";

/** A rule a touchpoint summary must pass. Check returns its problems, or none. */
export interface TouchpointSummaryRule {
  check(item: TouchpointSummary): string[];
}

export class TouchpointSummaryRequiredCodeRule implements TouchpointSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointSummaryApprovedGuardRule implements TouchpointSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TouchpointSummary): string[] {
    if (item.approved && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TouchpointSummaryRequiredLabelRule implements TouchpointSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointSummaryAllowedLabelRule implements TouchpointSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TouchpointSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class TouchpointSummaryRequiredCurrencyRule implements TouchpointSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointSummary): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint summary. */
export class TouchpointSummaryValidator {
  rules: TouchpointSummaryRule[];

  constructor(rules: TouchpointSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointSummary): string[] {
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

  requireValid(item: TouchpointSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointSummary[]): Map<string, string[]> {
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

export function defaultTouchpointSummaryValidator(): TouchpointSummaryValidator {
  return new TouchpointSummaryValidator(
    [
      new TouchpointSummaryRequiredCodeRule("touchpoint summary needs this field"),
      new TouchpointSummaryApprovedGuardRule(86400),
      new TouchpointSummaryRequiredLabelRule("touchpoint summary needs a value"),
      new TouchpointSummaryAllowedLabelRule(["default", "strict"]),
      new TouchpointSummaryRequiredCurrencyRule("touchpoint summary needs an entry"),
    ],
  );
}
