import * as text from "../../../../kit/text.js";
import { NudgeManifest } from "./nudge-manifest.js";

/** A rule a nudge manifest must pass. Check returns its problems, or none. */
export interface NudgeManifestRule {
  check(item: NudgeManifest): string[];
}

export class NudgeManifestUpdatedAtRangeRule implements NudgeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeManifest): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeManifestRequiredCodeRule implements NudgeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeManifestCostRangeRule implements NudgeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeManifest): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeManifestAllowedLabelRule implements NudgeManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class NudgeManifestCodeLengthRule implements NudgeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeManifestRequiredLabelRule implements NudgeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge manifest. */
export class NudgeManifestValidator {
  rules: NudgeManifestRule[];

  constructor(rules: NudgeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeManifest[]): Map<string, string[]> {
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

export function defaultNudgeManifestValidator(): NudgeManifestValidator {
  return new NudgeManifestValidator(
    [
      new NudgeManifestUpdatedAtRangeRule(16, 255),
      new NudgeManifestRequiredCodeRule("nudge manifest needs this field"),
      new NudgeManifestCostRangeRule(1.9, 1139.5),
      new NudgeManifestAllowedLabelRule(["weighted", "global", "primary"]),
      new NudgeManifestCodeLengthRule(80),
      new NudgeManifestRequiredLabelRule("nudge manifest needs a value"),
    ],
  );
}
