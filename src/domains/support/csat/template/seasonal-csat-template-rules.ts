import { SeasonalCsatTemplate } from "./seasonal-csat-template.js";

/** A rule a seasonal csat template must pass. Check returns its problems, or none. */
export interface SeasonalCsatTemplateRule {
  check(item: SeasonalCsatTemplate): string[];
}

export class SeasonalCsatTemplateWeightRangeRule implements SeasonalCsatTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCsatTemplate): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalCsatTemplateRequiredCodeRule implements SeasonalCsatTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCsatTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCsatTemplateRequiredJourneyIdRule implements SeasonalCsatTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCsatTemplate): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal csat template. */
export class SeasonalCsatTemplateValidator {
  rules: SeasonalCsatTemplateRule[];

  constructor(rules: SeasonalCsatTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCsatTemplate): string[] {
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

  requireValid(item: SeasonalCsatTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCsatTemplate[]): Map<string, string[]> {
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

export function defaultSeasonalCsatTemplateValidator(): SeasonalCsatTemplateValidator {
  return new SeasonalCsatTemplateValidator(
    [
      new SeasonalCsatTemplateWeightRangeRule(8.4, 188.7),
      new SeasonalCsatTemplateRequiredCodeRule("seasonal csat template needs this field"),
      new SeasonalCsatTemplateRequiredJourneyIdRule("seasonal csat template needs an entry"),
    ],
  );
}
