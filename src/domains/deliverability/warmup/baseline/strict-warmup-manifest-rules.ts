import * as text from "../../../../kit/text.js";
import { StrictWarmupManifest } from "./strict-warmup-manifest.js";

/** A rule a strict warmup manifest must pass. Check returns its problems, or none. */
export interface StrictWarmupManifestRule {
  check(item: StrictWarmupManifest): string[];
}

export class StrictWarmupManifestTitleLengthRule implements StrictWarmupManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWarmupManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWarmupManifestRequiredTitleRule implements StrictWarmupManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWarmupManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWarmupManifestAllowedJourneyIdRule implements StrictWarmupManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictWarmupManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is blocked`];
    return [];
  }
}

export class StrictWarmupManifestMarginRangeRule implements StrictWarmupManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictWarmupManifest): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict warmup manifest. */
export class StrictWarmupManifestValidator {
  rules: StrictWarmupManifestRule[];

  constructor(rules: StrictWarmupManifestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictWarmupManifest): string[] {
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

  requireValid(item: StrictWarmupManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictWarmupManifest[]): Map<string, string[]> {
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

export function defaultStrictWarmupManifestValidator(): StrictWarmupManifestValidator {
  return new StrictWarmupManifestValidator(
    [
      new StrictWarmupManifestTitleLengthRule(120),
      new StrictWarmupManifestRequiredTitleRule("strict warmup manifest needs a value"),
      new StrictWarmupManifestAllowedJourneyIdRule(["seasonal", "fallback", "capped"]),
      new StrictWarmupManifestMarginRangeRule(2.4, 2710.1),
    ],
  );
}
