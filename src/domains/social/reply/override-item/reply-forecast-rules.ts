import { ReplyForecast } from "./reply-forecast.js";

/** A rule a reply forecast must pass. Check returns its problems, or none. */
export interface ReplyForecastRule {
  check(item: ReplyForecast): string[];
}

export class ReplyForecastGraceDaysRangeRule implements ReplyForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyForecast): string[] {
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

export class ReplyForecastRequiredCodeRule implements ReplyForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyForecastLabelLengthRule implements ReplyForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyForecastFloorValueRangeRule implements ReplyForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyForecast): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyForecastRequiredLabelRule implements ReplyForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply forecast. */
export class ReplyForecastValidator {
  rules: ReplyForecastRule[];

  constructor(rules: ReplyForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyForecast): string[] {
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

  requireValid(item: ReplyForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyForecast[]): Map<string, string[]> {
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

export function defaultReplyForecastValidator(): ReplyForecastValidator {
  return new ReplyForecastValidator(
    [
      new ReplyForecastGraceDaysRangeRule(64, 86400),
      new ReplyForecastRequiredCodeRule("reply forecast needs a value"),
      new ReplyForecastLabelLengthRule(86400),
      new ReplyForecastFloorValueRangeRule(7.1, 3213),
      new ReplyForecastRequiredLabelRule("reply forecast needs a value"),
    ],
  );
}
