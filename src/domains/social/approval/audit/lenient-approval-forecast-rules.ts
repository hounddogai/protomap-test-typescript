import * as text from "../../../../kit/text.js";
import { LenientApprovalForecast } from "./lenient-approval-forecast.js";

/** A rule a lenient approval forecast must pass. Check returns its problems, or none. */
export interface LenientApprovalForecastRule {
  check(item: LenientApprovalForecast): string[];
}

export class LenientApprovalForecastRequiredCodeRule implements LenientApprovalForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientApprovalForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientApprovalForecastFloorValueRangeRule implements LenientApprovalForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientApprovalForecast): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientApprovalForecastAllowedNameRule implements LenientApprovalForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientApprovalForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class LenientApprovalForecastRequiredNameRule implements LenientApprovalForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientApprovalForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient approval forecast. */
export class LenientApprovalForecastValidator {
  rules: LenientApprovalForecastRule[];

  constructor(rules: LenientApprovalForecastRule[]) {
    this.rules = rules;
  }

  validate(item: LenientApprovalForecast): string[] {
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

  requireValid(item: LenientApprovalForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientApprovalForecast[]): Map<string, string[]> {
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

export function defaultLenientApprovalForecastValidator(): LenientApprovalForecastValidator {
  return new LenientApprovalForecastValidator(
    [
      new LenientApprovalForecastRequiredCodeRule("lenient approval forecast needs a value"),
      new LenientApprovalForecastFloorValueRangeRule(0.1, 465.7),
      new LenientApprovalForecastAllowedNameRule(["default"]),
      new LenientApprovalForecastRequiredNameRule("lenient approval forecast needs a value"),
    ],
  );
}
