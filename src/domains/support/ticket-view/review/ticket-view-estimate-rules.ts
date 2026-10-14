import { TicketViewEstimate } from "./ticket-view-estimate.js";

/** A rule a ticket view estimate must pass. Check returns its problems, or none. */
export interface TicketViewEstimateRule {
  check(item: TicketViewEstimate): string[];
}

export class TicketViewEstimateCodeLengthRule implements TicketViewEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewEstimateRequiredSummaryRule implements TicketViewEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewEstimate): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewEstimateTagsLimitRule implements TicketViewEstimateRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TicketViewEstimate): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class TicketViewEstimateRequiredNameRule implements TicketViewEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a ticket view estimate. */
export class TicketViewEstimateValidator {
  rules: TicketViewEstimateRule[];

  constructor(rules: TicketViewEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewEstimate[]): Map<string, string[]> {
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

export function defaultTicketViewEstimateValidator(): TicketViewEstimateValidator {
  return new TicketViewEstimateValidator(
    [
      new TicketViewEstimateCodeLengthRule(255),
      new TicketViewEstimateRequiredSummaryRule("ticket view estimate needs a value"),
      new TicketViewEstimateTagsLimitRule(32, []),
      new TicketViewEstimateRequiredNameRule("ticket view estimate needs this field"),
    ],
  );
}
