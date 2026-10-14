import * as text from "../../../../kit/text.js";
import { PrimaryCohortRollup } from "./primary-cohort-rollup.js";

/** A rule a primary cohort rollup must pass. Check returns its problems, or none. */
export interface PrimaryCohortRollupRule {
  check(item: PrimaryCohortRollup): string[];
}

export class PrimaryCohortRollupCodePrefixRule implements PrimaryCohortRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryCohortRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryCohortRollupAllowedLabelRule implements PrimaryCohortRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryCohortRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class PrimaryCohortRollupRequiredCodeRule implements PrimaryCohortRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCohortRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary cohort rollup. */
export class PrimaryCohortRollupValidator {
  rules: PrimaryCohortRollupRule[];

  constructor(rules: PrimaryCohortRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCohortRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryCohortRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCohortRollup[]): Map<string, string[]> {
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

export function defaultPrimaryCohortRollupValidator(): PrimaryCohortRollupValidator {
  return new PrimaryCohortRollupValidator(
    [
      new PrimaryCohortRollupCodePrefixRule("ACM"),
      new PrimaryCohortRollupAllowedLabelRule(["seasonal"]),
      new PrimaryCohortRollupRequiredCodeRule("primary cohort rollup needs this field"),
    ],
  );
}
