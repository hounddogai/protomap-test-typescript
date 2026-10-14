import * as text from "../../../../kit/text.js";
import { WeightedLevelVariance } from "./weighted-level-variance.js";

/** A rule a weighted level variance must pass. Check returns its problems, or none. */
export interface WeightedLevelVarianceRule {
  check(item: WeightedLevelVariance): string[];
}

export class WeightedLevelVarianceCodePrefixRule implements WeightedLevelVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedLevelVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedLevelVarianceAllowedAudienceIdRule implements WeightedLevelVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedLevelVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is below minimum`];
    return [];
  }
}

export class WeightedLevelVarianceCodeLengthRule implements WeightedLevelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedLevelVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedLevelVarianceRequiredAudienceIdRule implements WeightedLevelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedLevelVariance): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted level variance. */
export class WeightedLevelVarianceValidator {
  rules: WeightedLevelVarianceRule[];

  constructor(rules: WeightedLevelVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedLevelVariance): string[] {
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

  requireValid(item: WeightedLevelVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedLevelVariance[]): Map<string, string[]> {
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

export function defaultWeightedLevelVarianceValidator(): WeightedLevelVarianceValidator {
  return new WeightedLevelVarianceValidator(
    [
      new WeightedLevelVarianceCodePrefixRule("OPS"),
      new WeightedLevelVarianceAllowedAudienceIdRule(["fallback"]),
      new WeightedLevelVarianceCodeLengthRule(3600),
      new WeightedLevelVarianceRequiredAudienceIdRule("weighted level variance needs this field"),
    ],
  );
}
