import { ConversionScore } from "./conversion-score.js";

/** A rule a conversion score must pass. Check returns its problems, or none. */
export interface ConversionScoreRule {
  check(item: ConversionScore): string[];
}

export class ConversionScoreLabelLengthRule implements ConversionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionScoreRequiredCampaignRefRule implements ConversionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionScore): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionScoreRequiredLabelRule implements ConversionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionScoreCodeLengthRule implements ConversionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionScoreBudgetRangeRule implements ConversionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionScore): string[] {
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

/** Runs every rule of a conversion score. */
export class ConversionScoreValidator {
  rules: ConversionScoreRule[];

  constructor(rules: ConversionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionScore[]): Map<string, string[]> {
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

export function defaultConversionScoreValidator(): ConversionScoreValidator {
  return new ConversionScoreValidator(
    [
      new ConversionScoreLabelLengthRule(64),
      new ConversionScoreRequiredCampaignRefRule("conversion score needs this field"),
      new ConversionScoreRequiredLabelRule("conversion score needs this field"),
      new ConversionScoreCodeLengthRule(32),
      new ConversionScoreBudgetRangeRule(7.3, 4101.3),
    ],
  );
}
