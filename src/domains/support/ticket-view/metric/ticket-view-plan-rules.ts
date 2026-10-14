import { TicketViewPlan } from "./ticket-view-plan.js";

/** A rule a ticket view plan must pass. Check returns its problems, or none. */
export interface TicketViewPlanRule {
  check(item: TicketViewPlan): string[];
}

export class TicketViewPlanCodeLengthRule implements TicketViewPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewPlanRequiredRegionRule implements TicketViewPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewPlan): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewPlanRequiredCodeRule implements TicketViewPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewPlanRegionLengthRule implements TicketViewPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewPlan): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewPlanCodePrefixRule implements TicketViewPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewPlanBatchSizeRangeRule implements TicketViewPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewPlan): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a ticket view plan. */
export class TicketViewPlanValidator {
  rules: TicketViewPlanRule[];

  constructor(rules: TicketViewPlanRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewPlan[]): Map<string, string[]> {
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

export function defaultTicketViewPlanValidator(): TicketViewPlanValidator {
  return new TicketViewPlanValidator(
    [
      new TicketViewPlanCodeLengthRule(1000),
      new TicketViewPlanRequiredRegionRule("ticket view plan needs this field"),
      new TicketViewPlanRequiredCodeRule("ticket view plan needs this field"),
      new TicketViewPlanRegionLengthRule(1000),
      new TicketViewPlanCodePrefixRule("Q"),
      new TicketViewPlanBatchSizeRangeRule(255, 3600),
    ],
  );
}
