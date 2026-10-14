import * as text from "../../../../kit/text.js";
import { ManualQueuePreference } from "./manual-queue-preference.js";

/** A rule a manual queue preference must pass. Check returns its problems, or none. */
export interface ManualQueuePreferenceRule {
  check(item: ManualQueuePreference): string[];
}

export class ManualQueuePreferencePinnedGuardRule implements ManualQueuePreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualQueuePreference): string[] {
    if (item.pinned && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class ManualQueuePreferenceRevisionRangeRule implements ManualQueuePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualQueuePreference): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualQueuePreferenceAllowedLabelRule implements ManualQueuePreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualQueuePreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

/** Runs every rule of a manual queue preference. */
export class ManualQueuePreferenceValidator {
  rules: ManualQueuePreferenceRule[];

  constructor(rules: ManualQueuePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ManualQueuePreference): string[] {
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

  requireValid(item: ManualQueuePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualQueuePreference[]): Map<string, string[]> {
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

export function defaultManualQueuePreferenceValidator(): ManualQueuePreferenceValidator {
  return new ManualQueuePreferenceValidator(
    [
      new ManualQueuePreferencePinnedGuardRule(4.8),
      new ManualQueuePreferenceRevisionRangeRule(32, 255),
      new ManualQueuePreferenceAllowedLabelRule(["scheduled", "batched"]),
    ],
  );
}
