import { TieredTicketViewAdjustment } from "./tiered-ticket-view-adjustment.js";

/** A rule a tiered ticket view adjustment must pass. Check returns its problems, or none. */
export interface TieredTicketViewAdjustmentRule {
  check(item: TieredTicketViewAdjustment): string[];
}

export class TieredTicketViewAdjustmentRequiredRegionRule implements TieredTicketViewAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTicketViewAdjustment): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTicketViewAdjustmentRequiredTitleRule implements TieredTicketViewAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTicketViewAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTicketViewAdjustmentCodeLengthRule implements TieredTicketViewAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTicketViewAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered ticket view adjustment. */
export class TieredTicketViewAdjustmentValidator {
  rules: TieredTicketViewAdjustmentRule[];

  constructor(rules: TieredTicketViewAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTicketViewAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredTicketViewAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTicketViewAdjustment[]): Map<string, string[]> {
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

export function defaultTieredTicketViewAdjustmentValidator(): TieredTicketViewAdjustmentValidator {
  return new TieredTicketViewAdjustmentValidator(
    [
      new TieredTicketViewAdjustmentRequiredRegionRule("tiered ticket view adjustment needs a value"),
      new TieredTicketViewAdjustmentRequiredTitleRule("tiered ticket view adjustment needs a value"),
      new TieredTicketViewAdjustmentCodeLengthRule(1000),
    ],
  );
}
