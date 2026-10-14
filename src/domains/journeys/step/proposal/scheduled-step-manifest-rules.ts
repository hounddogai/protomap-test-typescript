import * as text from "../../../../kit/text.js";
import { ScheduledStepManifest } from "./scheduled-step-manifest.js";

/** A rule a scheduled step manifest must pass. Check returns its problems, or none. */
export interface ScheduledStepManifestRule {
  check(item: ScheduledStepManifest): string[];
}

export class ScheduledStepManifestQuantityRangeRule implements ScheduledStepManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledStepManifest): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledStepManifestLabelLengthRule implements ScheduledStepManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledStepManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledStepManifestCodePrefixRule implements ScheduledStepManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledStepManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledStepManifestRequiredCodeRule implements ScheduledStepManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledStepManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledStepManifestVisibleGuardRule implements ScheduledStepManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledStepManifest): string[] {
    if (item.visible && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ScheduledStepManifestAllowedLabelRule implements ScheduledStepManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledStepManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

/** Runs every rule of a scheduled step manifest. */
export class ScheduledStepManifestValidator {
  rules: ScheduledStepManifestRule[];

  constructor(rules: ScheduledStepManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledStepManifest): string[] {
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

  requireValid(item: ScheduledStepManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledStepManifest[]): Map<string, string[]> {
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

export function defaultScheduledStepManifestValidator(): ScheduledStepManifestValidator {
  return new ScheduledStepManifestValidator(
    [
      new ScheduledStepManifestQuantityRangeRule(16, 16),
      new ScheduledStepManifestLabelLengthRule(86400),
      new ScheduledStepManifestCodePrefixRule("ACM"),
      new ScheduledStepManifestRequiredCodeRule("scheduled step manifest needs this field"),
      new ScheduledStepManifestVisibleGuardRule(16),
      new ScheduledStepManifestAllowedLabelRule([]),
    ],
  );
}
