import { ManualTicketViewEstimate } from "./manual-ticket-view-estimate.js";

/** A rule a manual ticket view estimate must pass. Check returns its problems, or none. */
export interface ManualTicketViewEstimateRule {
  check(item: ManualTicketViewEstimate): string[];
}

export class ManualTicketViewEstimateCodeLengthRule implements ManualTicketViewEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTicketViewEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTicketViewEstimateRequiredTitleRule implements ManualTicketViewEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTicketViewEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTicketViewEstimateRatioRangeRule implements ManualTicketViewEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTicketViewEstimate): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual ticket view estimate. */
export class ManualTicketViewEstimateValidator {
  rules: ManualTicketViewEstimateRule[];

  constructor(rules: ManualTicketViewEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTicketViewEstimate): string[] {
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

  requireValid(item: ManualTicketViewEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTicketViewEstimate[]): Map<string, string[]> {
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

export function defaultManualTicketViewEstimateValidator(): ManualTicketViewEstimateValidator {
  return new ManualTicketViewEstimateValidator(
    [
      new ManualTicketViewEstimateCodeLengthRule(16),
      new ManualTicketViewEstimateRequiredTitleRule("manual ticket view estimate needs this field"),
      new ManualTicketViewEstimateRatioRangeRule(3.8, 4563.3),
    ],
  );
}
