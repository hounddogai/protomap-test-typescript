import * as text from "../../../../kit/text.js";
import { SeasonalInsightTarget } from "./seasonal-insight-target.js";

/** A rule a seasonal insight target must pass. Check returns its problems, or none. */
export interface SeasonalInsightTargetRule {
  check(item: SeasonalInsightTarget): string[];
}

export class SeasonalInsightTargetAllowedCodeRule implements SeasonalInsightTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalInsightTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class SeasonalInsightTargetRequiredChannelRule implements SeasonalInsightTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalInsightTarget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalInsightTargetChannelLengthRule implements SeasonalInsightTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalInsightTarget): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalInsightTargetQuantityRangeRule implements SeasonalInsightTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalInsightTarget): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal insight target. */
export class SeasonalInsightTargetValidator {
  rules: SeasonalInsightTargetRule[];

  constructor(rules: SeasonalInsightTargetRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalInsightTarget): string[] {
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

  requireValid(item: SeasonalInsightTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalInsightTarget[]): Map<string, string[]> {
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

export function defaultSeasonalInsightTargetValidator(): SeasonalInsightTargetValidator {
  return new SeasonalInsightTargetValidator(
    [
      new SeasonalInsightTargetAllowedCodeRule(["legacy"]),
      new SeasonalInsightTargetRequiredChannelRule("seasonal insight target needs this field"),
      new SeasonalInsightTargetChannelLengthRule(3600),
      new SeasonalInsightTargetQuantityRangeRule(16, 120),
    ],
  );
}
