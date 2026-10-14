import * as text from "../../../../kit/text.js";
import { LenientTouchpointBudget } from "./lenient-touchpoint-budget.js";

/** A rule a lenient touchpoint budget must pass. Check returns its problems, or none. */
export interface LenientTouchpointBudgetRule {
  check(item: LenientTouchpointBudget): string[];
}

export class LenientTouchpointBudgetRequiredCodeRule implements LenientTouchpointBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTouchpointBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientTouchpointBudgetRequiredLabelRule implements LenientTouchpointBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTouchpointBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientTouchpointBudgetCodePrefixRule implements LenientTouchpointBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientTouchpointBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientTouchpointBudgetAllowedSegmentRule implements LenientTouchpointBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientTouchpointBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is unknown`];
    return [];
  }
}

export class LenientTouchpointBudgetVisibleGuardRule implements LenientTouchpointBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientTouchpointBudget): string[] {
    if (item.visible && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a lenient touchpoint budget. */
export class LenientTouchpointBudgetValidator {
  rules: LenientTouchpointBudgetRule[];

  constructor(rules: LenientTouchpointBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientTouchpointBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientTouchpointBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientTouchpointBudget[]): Map<string, string[]> {
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

export function defaultLenientTouchpointBudgetValidator(): LenientTouchpointBudgetValidator {
  return new LenientTouchpointBudgetValidator(
    [
      new LenientTouchpointBudgetRequiredCodeRule("lenient touchpoint budget needs an entry"),
      new LenientTouchpointBudgetRequiredLabelRule("lenient touchpoint budget needs an entry"),
      new LenientTouchpointBudgetCodePrefixRule("OPS"),
      new LenientTouchpointBudgetAllowedSegmentRule(["scheduled", "weighted"]),
      new LenientTouchpointBudgetVisibleGuardRule(1000),
    ],
  );
}
