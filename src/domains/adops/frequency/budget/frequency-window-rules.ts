import { FrequencyWindow } from "./frequency-window.js";

/** A rule a frequency window must pass. Check returns its problems, or none. */
export interface FrequencyWindowRule {
  check(item: FrequencyWindow): string[];
}

export class FrequencyWindowGraceDaysRangeRule implements FrequencyWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyWindow): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyWindowRequiredJourneyIdRule implements FrequencyWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyWindow): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyWindowClicksRangeRule implements FrequencyWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyWindow): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a frequency window. */
export class FrequencyWindowValidator {
  rules: FrequencyWindowRule[];

  constructor(rules: FrequencyWindowRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyWindow[]): Map<string, string[]> {
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

export function defaultFrequencyWindowValidator(): FrequencyWindowValidator {
  return new FrequencyWindowValidator(
    [
      new FrequencyWindowGraceDaysRangeRule(32, 32),
      new FrequencyWindowRequiredJourneyIdRule("frequency window needs this field"),
      new FrequencyWindowClicksRangeRule(32, 255),
    ],
  );
}
