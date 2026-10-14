import { SeasonalJourneyRequest } from "./seasonal-journey-request.js";

/** A rule a seasonal journey request must pass. Check returns its problems, or none. */
export interface SeasonalJourneyRequestRule {
  check(item: SeasonalJourneyRequest): string[];
}

export class SeasonalJourneyRequestMarginRangeRule implements SeasonalJourneyRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalJourneyRequest): string[] {
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

export class SeasonalJourneyRequestSourceLengthRule implements SeasonalJourneyRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalJourneyRequest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalJourneyRequestOpenRateRangeRule implements SeasonalJourneyRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalJourneyRequest): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalJourneyRequestRequiredLabelRule implements SeasonalJourneyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalJourneyRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal journey request. */
export class SeasonalJourneyRequestValidator {
  rules: SeasonalJourneyRequestRule[];

  constructor(rules: SeasonalJourneyRequestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalJourneyRequest): string[] {
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

  requireValid(item: SeasonalJourneyRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalJourneyRequest[]): Map<string, string[]> {
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

export function defaultSeasonalJourneyRequestValidator(): SeasonalJourneyRequestValidator {
  return new SeasonalJourneyRequestValidator(
    [
      new SeasonalJourneyRequestMarginRangeRule(7.6, 3484.4),
      new SeasonalJourneyRequestSourceLengthRule(120),
      new SeasonalJourneyRequestOpenRateRangeRule(8, 465.7),
      new SeasonalJourneyRequestRequiredLabelRule("seasonal journey request needs this field"),
    ],
  );
}
