import { WeightedMacroScore } from "./weighted-macro-score.js";

/** A rule a weighted macro score must pass. Check returns its problems, or none. */
export interface WeightedMacroScoreRule {
  check(item: WeightedMacroScore): string[];
}

export class WeightedMacroScoreRequiredCampaignRefRule implements WeightedMacroScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMacroScore): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedMacroScoreRequiredLabelRule implements WeightedMacroScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMacroScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedMacroScoreQuantityRangeRule implements WeightedMacroScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedMacroScore): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedMacroScoreCodePrefixRule implements WeightedMacroScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedMacroScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedMacroScoreMaximumRangeRule implements WeightedMacroScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedMacroScore): string[] {
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

/** Runs every rule of a weighted macro score. */
export class WeightedMacroScoreValidator {
  rules: WeightedMacroScoreRule[];

  constructor(rules: WeightedMacroScoreRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedMacroScore): string[] {
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

  requireValid(item: WeightedMacroScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedMacroScore[]): Map<string, string[]> {
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

export function defaultWeightedMacroScoreValidator(): WeightedMacroScoreValidator {
  return new WeightedMacroScoreValidator(
    [
      new WeightedMacroScoreRequiredCampaignRefRule("weighted macro score needs a value"),
      new WeightedMacroScoreRequiredLabelRule("weighted macro score needs an entry"),
      new WeightedMacroScoreQuantityRangeRule(32, 64),
      new WeightedMacroScoreCodePrefixRule("OPS"),
      new WeightedMacroScoreMaximumRangeRule(7.2, 4082.7),
    ],
  );
}
