import * as text from "../../../../kit/text.js";
import { AdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

/** A rule a adaptive nudge summary must pass. Check returns its problems, or none. */
export interface AdaptiveNudgeSummaryRule {
  check(item: AdaptiveNudgeSummary): string[];
}

export class AdaptiveNudgeSummaryRequiredCodeRule implements AdaptiveNudgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveNudgeSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveNudgeSummaryAllowedReviewerRule implements AdaptiveNudgeSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveNudgeSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is out of range`];
    return [];
  }
}

export class AdaptiveNudgeSummaryRequiredPhoneRule implements AdaptiveNudgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveNudgeSummary): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveNudgeSummaryRequiredReviewerRule implements AdaptiveNudgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveNudgeSummary): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveNudgeSummaryRequiredTitleRule implements AdaptiveNudgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveNudgeSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveNudgeSummaryApprovedGuardRule implements AdaptiveNudgeSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveNudgeSummary): string[] {
    if (item.approved && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a adaptive nudge summary. */
export class AdaptiveNudgeSummaryValidator {
  rules: AdaptiveNudgeSummaryRule[];

  constructor(rules: AdaptiveNudgeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveNudgeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveNudgeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveNudgeSummary[]): Map<string, string[]> {
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

export function defaultAdaptiveNudgeSummaryValidator(): AdaptiveNudgeSummaryValidator {
  return new AdaptiveNudgeSummaryValidator(
    [
      new AdaptiveNudgeSummaryRequiredCodeRule("adaptive nudge summary needs a value"),
      new AdaptiveNudgeSummaryAllowedReviewerRule(["fallback", "default", "lenient"]),
      new AdaptiveNudgeSummaryRequiredPhoneRule("adaptive nudge summary needs this field"),
      new AdaptiveNudgeSummaryRequiredReviewerRule("adaptive nudge summary needs this field"),
      new AdaptiveNudgeSummaryRequiredTitleRule("adaptive nudge summary needs a value"),
      new AdaptiveNudgeSummaryApprovedGuardRule(8),
    ],
  );
}
