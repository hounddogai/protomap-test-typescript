import * as text from "../../../../kit/text.js";
import { LegacyStepScore } from "./legacy-step-score.js";

/** A rule a legacy step score must pass. Check returns its problems, or none. */
export interface LegacyStepScoreRule {
  check(item: LegacyStepScore): string[];
}

export class LegacyStepScoreMaximumRangeRule implements LegacyStepScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyStepScore): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyStepScoreAllowedTitleRule implements LegacyStepScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyStepScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class LegacyStepScoreRequiredCodeRule implements LegacyStepScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyStepScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyStepScoreCapacityRangeRule implements LegacyStepScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyStepScore): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyStepScoreRequiredChannelRule implements LegacyStepScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyStepScore): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy step score. */
export class LegacyStepScoreValidator {
  rules: LegacyStepScoreRule[];

  constructor(rules: LegacyStepScoreRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyStepScore): string[] {
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

  requireValid(item: LegacyStepScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyStepScore[]): Map<string, string[]> {
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

export function defaultLegacyStepScoreValidator(): LegacyStepScoreValidator {
  return new LegacyStepScoreValidator(
    [
      new LegacyStepScoreMaximumRangeRule(6.8, 2111.1),
      new LegacyStepScoreAllowedTitleRule(["fallback"]),
      new LegacyStepScoreRequiredCodeRule("legacy step score needs this field"),
      new LegacyStepScoreCapacityRangeRule(3600, 86400),
      new LegacyStepScoreRequiredChannelRule("legacy step score needs a value"),
    ],
  );
}
