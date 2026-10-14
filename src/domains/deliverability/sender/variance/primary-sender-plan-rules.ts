import * as text from "../../../../kit/text.js";
import { PrimarySenderPlan } from "./primary-sender-plan.js";

/** A rule a primary sender plan must pass. Check returns its problems, or none. */
export interface PrimarySenderPlanRule {
  check(item: PrimarySenderPlan): string[];
}

export class PrimarySenderPlanAllowedCodeRule implements PrimarySenderPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimarySenderPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class PrimarySenderPlanCodeLengthRule implements PrimarySenderPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySenderPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySenderPlanPinnedGuardRule implements PrimarySenderPlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimarySenderPlan): string[] {
    if (item.pinned && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PrimarySenderPlanCodePrefixRule implements PrimarySenderPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimarySenderPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary sender plan. */
export class PrimarySenderPlanValidator {
  rules: PrimarySenderPlanRule[];

  constructor(rules: PrimarySenderPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySenderPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySenderPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySenderPlan[]): Map<string, string[]> {
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

export function defaultPrimarySenderPlanValidator(): PrimarySenderPlanValidator {
  return new PrimarySenderPlanValidator(
    [
      new PrimarySenderPlanAllowedCodeRule([]),
      new PrimarySenderPlanCodeLengthRule(86400),
      new PrimarySenderPlanPinnedGuardRule(1),
      new PrimarySenderPlanCodePrefixRule("OPS"),
    ],
  );
}
