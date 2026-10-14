import * as text from "../../../../kit/text.js";
import { ScheduledStreakManifest } from "./scheduled-streak-manifest.js";

/** A rule a scheduled streak manifest must pass. Check returns its problems, or none. */
export interface ScheduledStreakManifestRule {
  check(item: ScheduledStreakManifest): string[];
}

export class ScheduledStreakManifestRequiredLabelRule implements ScheduledStreakManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledStreakManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledStreakManifestRequiredAudienceIdRule implements ScheduledStreakManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledStreakManifest): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledStreakManifestBudgetRangeRule implements ScheduledStreakManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledStreakManifest): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledStreakManifestAllowedLabelRule implements ScheduledStreakManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledStreakManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class ScheduledStreakManifestRequiredSummaryRule implements ScheduledStreakManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledStreakManifest): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledStreakManifestRequiredCodeRule implements ScheduledStreakManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledStreakManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled streak manifest. */
export class ScheduledStreakManifestValidator {
  rules: ScheduledStreakManifestRule[];

  constructor(rules: ScheduledStreakManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledStreakManifest): string[] {
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

  requireValid(item: ScheduledStreakManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledStreakManifest[]): Map<string, string[]> {
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

export function defaultScheduledStreakManifestValidator(): ScheduledStreakManifestValidator {
  return new ScheduledStreakManifestValidator(
    [
      new ScheduledStreakManifestRequiredLabelRule("scheduled streak manifest needs an entry"),
      new ScheduledStreakManifestRequiredAudienceIdRule("scheduled streak manifest needs a value"),
      new ScheduledStreakManifestBudgetRangeRule(0.5, 3268.1),
      new ScheduledStreakManifestAllowedLabelRule(["scheduled", "seasonal", "legacy"]),
      new ScheduledStreakManifestRequiredSummaryRule("scheduled streak manifest needs a value"),
      new ScheduledStreakManifestRequiredCodeRule("scheduled streak manifest needs a value"),
    ],
  );
}
