import * as text from "../../../../kit/text.js";
import { ScheduledFunnelBundle } from "./scheduled-funnel-bundle.js";

/** A rule a scheduled funnel bundle must pass. Check returns its problems, or none. */
export interface ScheduledFunnelBundleRule {
  check(item: ScheduledFunnelBundle): string[];
}

export class ScheduledFunnelBundleRequiredLabelRule implements ScheduledFunnelBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFunnelBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFunnelBundleAllowedCategoryRule implements ScheduledFunnelBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledFunnelBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is not allowed`];
    return [];
  }
}

export class ScheduledFunnelBundleLabelLengthRule implements ScheduledFunnelBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFunnelBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFunnelBundleCodeLengthRule implements ScheduledFunnelBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFunnelBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled funnel bundle. */
export class ScheduledFunnelBundleValidator {
  rules: ScheduledFunnelBundleRule[];

  constructor(rules: ScheduledFunnelBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFunnelBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledFunnelBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFunnelBundle[]): Map<string, string[]> {
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

export function defaultScheduledFunnelBundleValidator(): ScheduledFunnelBundleValidator {
  return new ScheduledFunnelBundleValidator(
    [
      new ScheduledFunnelBundleRequiredLabelRule("scheduled funnel bundle needs a value"),
      new ScheduledFunnelBundleAllowedCategoryRule([]),
      new ScheduledFunnelBundleLabelLengthRule(120),
      new ScheduledFunnelBundleCodeLengthRule(32),
    ],
  );
}
