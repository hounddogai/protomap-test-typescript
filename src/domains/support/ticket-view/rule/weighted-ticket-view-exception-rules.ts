import { WeightedTicketViewException } from "./weighted-ticket-view-exception.js";

/** A rule a weighted ticket view exception must pass. Check returns its problems, or none. */
export interface WeightedTicketViewExceptionRule {
  check(item: WeightedTicketViewException): string[];
}

export class WeightedTicketViewExceptionTitleLengthRule implements WeightedTicketViewExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTicketViewException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTicketViewExceptionCodeLengthRule implements WeightedTicketViewExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTicketViewException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTicketViewExceptionRequiredContactEmailRule implements WeightedTicketViewExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTicketViewException): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted ticket view exception. */
export class WeightedTicketViewExceptionValidator {
  rules: WeightedTicketViewExceptionRule[];

  constructor(rules: WeightedTicketViewExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTicketViewException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedTicketViewException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTicketViewException[]): Map<string, string[]> {
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

export function defaultWeightedTicketViewExceptionValidator(): WeightedTicketViewExceptionValidator {
  return new WeightedTicketViewExceptionValidator(
    [
      new WeightedTicketViewExceptionTitleLengthRule(16),
      new WeightedTicketViewExceptionCodeLengthRule(80),
      new WeightedTicketViewExceptionRequiredContactEmailRule("weighted ticket view exception needs a value"),
    ],
  );
}
