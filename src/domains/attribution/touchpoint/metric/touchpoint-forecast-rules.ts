import * as text from "../../../../kit/text.js";
import { TouchpointForecast } from "./touchpoint-forecast.js";

/** A rule a touchpoint forecast must pass. Check returns its problems, or none. */
export interface TouchpointForecastRule {
  check(item: TouchpointForecast): string[];
}

export class TouchpointForecastAllowedTitleRule implements TouchpointForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TouchpointForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class TouchpointForecastTitleLengthRule implements TouchpointForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointForecastRequiredCodeRule implements TouchpointForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointForecastCodeLengthRule implements TouchpointForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointForecastCampaignRefLengthRule implements TouchpointForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointForecast): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a touchpoint forecast. */
export class TouchpointForecastValidator {
  rules: TouchpointForecastRule[];

  constructor(rules: TouchpointForecastRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointForecast[]): Map<string, string[]> {
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

export function defaultTouchpointForecastValidator(): TouchpointForecastValidator {
  return new TouchpointForecastValidator(
    [
      new TouchpointForecastAllowedTitleRule(["rolling", "default"]),
      new TouchpointForecastTitleLengthRule(120),
      new TouchpointForecastRequiredCodeRule("touchpoint forecast needs this field"),
      new TouchpointForecastCodeLengthRule(64),
      new TouchpointForecastCampaignRefLengthRule(120),
    ],
  );
}
