import * as text from "../../../../kit/text.js";
import { AdaptiveBounceAdjustment } from "./adaptive-bounce-adjustment.js";

/** A rule a adaptive bounce adjustment must pass. Check returns its problems, or none. */
export interface AdaptiveBounceAdjustmentRule {
  check(item: AdaptiveBounceAdjustment): string[];
}

export class AdaptiveBounceAdjustmentRequiredLabelRule implements AdaptiveBounceAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBounceAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveBounceAdjustmentRequiredCodeRule implements AdaptiveBounceAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBounceAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveBounceAdjustmentAllowedCodeRule implements AdaptiveBounceAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveBounceAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class AdaptiveBounceAdjustmentRequiredCohortRule implements AdaptiveBounceAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBounceAdjustment): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive bounce adjustment. */
export class AdaptiveBounceAdjustmentValidator {
  rules: AdaptiveBounceAdjustmentRule[];

  constructor(rules: AdaptiveBounceAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBounceAdjustment): string[] {
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

  requireValid(item: AdaptiveBounceAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBounceAdjustment[]): Map<string, string[]> {
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

export function defaultAdaptiveBounceAdjustmentValidator(): AdaptiveBounceAdjustmentValidator {
  return new AdaptiveBounceAdjustmentValidator(
    [
      new AdaptiveBounceAdjustmentRequiredLabelRule("adaptive bounce adjustment needs an entry"),
      new AdaptiveBounceAdjustmentRequiredCodeRule("adaptive bounce adjustment needs this field"),
      new AdaptiveBounceAdjustmentAllowedCodeRule(["batched"]),
      new AdaptiveBounceAdjustmentRequiredCohortRule("adaptive bounce adjustment needs this field"),
    ],
  );
}
