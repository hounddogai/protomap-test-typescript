import * as text from "../../../../kit/text.js";
import { FallbackPathAdjustment } from "./fallback-path-adjustment.js";

/** A rule a fallback path adjustment must pass. Check returns its problems, or none. */
export interface FallbackPathAdjustmentRule {
  check(item: FallbackPathAdjustment): string[];
}

export class FallbackPathAdjustmentAllowedCohortRule implements FallbackPathAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPathAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is too long`];
    return [];
  }
}

export class FallbackPathAdjustmentCodePrefixRule implements FallbackPathAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPathAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackPathAdjustmentRequiredLabelRule implements FallbackPathAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPathAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPathAdjustmentRequiredCohortRule implements FallbackPathAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPathAdjustment): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback path adjustment. */
export class FallbackPathAdjustmentValidator {
  rules: FallbackPathAdjustmentRule[];

  constructor(rules: FallbackPathAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPathAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackPathAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPathAdjustment[]): Map<string, string[]> {
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

export function defaultFallbackPathAdjustmentValidator(): FallbackPathAdjustmentValidator {
  return new FallbackPathAdjustmentValidator(
    [
      new FallbackPathAdjustmentAllowedCohortRule(["fallback", "regional"]),
      new FallbackPathAdjustmentCodePrefixRule("Q"),
      new FallbackPathAdjustmentRequiredLabelRule("fallback path adjustment needs a value"),
      new FallbackPathAdjustmentRequiredCohortRule("fallback path adjustment needs an entry"),
    ],
  );
}
