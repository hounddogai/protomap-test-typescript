import { ExitRuleRequest } from "./exit-rule-request.js";

/** A rule a exit rule request must pass. Check returns its problems, or none. */
export interface ExitRuleRequestRule {
  check(item: ExitRuleRequest): string[];
}

export class ExitRuleRequestGraceDaysRangeRule implements ExitRuleRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleRequest): string[] {
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

export class ExitRuleRequestRequiredCodeRule implements ExitRuleRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleRequestPhoneLengthRule implements ExitRuleRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleRequest): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleRequestWindowDaysRangeRule implements ExitRuleRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleRequest): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleRequestThresholdRangeRule implements ExitRuleRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleRequest): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a exit rule request. */
export class ExitRuleRequestValidator {
  rules: ExitRuleRequestRule[];

  constructor(rules: ExitRuleRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleRequest[]): Map<string, string[]> {
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

export function defaultExitRuleRequestValidator(): ExitRuleRequestValidator {
  return new ExitRuleRequestValidator(
    [
      new ExitRuleRequestGraceDaysRangeRule(80, 86400),
      new ExitRuleRequestRequiredCodeRule("exit rule request needs a value"),
      new ExitRuleRequestPhoneLengthRule(255),
      new ExitRuleRequestWindowDaysRangeRule(255, 3600),
      new ExitRuleRequestThresholdRangeRule(2.8, 3881.1),
    ],
  );
}
