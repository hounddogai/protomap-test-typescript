import { PlacementException } from "./placement-exception.js";

/** A rule a placement exception must pass. Check returns its problems, or none. */
export interface PlacementExceptionRule {
  check(item: PlacementException): string[];
}

export class PlacementExceptionSendAtRangeRule implements PlacementExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementException): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementExceptionMarginRangeRule implements PlacementExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementException): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementExceptionCodePrefixRule implements PlacementExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a placement exception. */
export class PlacementExceptionValidator {
  rules: PlacementExceptionRule[];

  constructor(rules: PlacementExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementException[]): Map<string, string[]> {
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

export function defaultPlacementExceptionValidator(): PlacementExceptionValidator {
  return new PlacementExceptionValidator(
    [
      new PlacementExceptionSendAtRangeRule(1000, 86400),
      new PlacementExceptionMarginRangeRule(4.6, 316.9),
      new PlacementExceptionCodePrefixRule("Q"),
    ],
  );
}
