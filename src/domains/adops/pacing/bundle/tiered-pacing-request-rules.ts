import { TieredPacingRequest } from "./tiered-pacing-request.js";

/** A rule a tiered pacing request must pass. Check returns its problems, or none. */
export interface TieredPacingRequestRule {
  check(item: TieredPacingRequest): string[];
}

export class TieredPacingRequestBudgetRangeRule implements TieredPacingRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPacingRequest): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPacingRequestAmountRangeRule implements TieredPacingRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPacingRequest): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPacingRequestRequiredCodeRule implements TieredPacingRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPacingRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered pacing request. */
export class TieredPacingRequestValidator {
  rules: TieredPacingRequestRule[];

  constructor(rules: TieredPacingRequestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPacingRequest): string[] {
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

  requireValid(item: TieredPacingRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPacingRequest[]): Map<string, string[]> {
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

export function defaultTieredPacingRequestValidator(): TieredPacingRequestValidator {
  return new TieredPacingRequestValidator(
    [
      new TieredPacingRequestBudgetRangeRule(0.4, 2941.4),
      new TieredPacingRequestAmountRangeRule(0.4, 1887.9),
      new TieredPacingRequestRequiredCodeRule("tiered pacing request needs a value"),
    ],
  );
}
