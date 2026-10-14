import { TicketViewTarget } from "./ticket-view-target.js";

/** A rule a ticket view target must pass. Check returns its problems, or none. */
export interface TicketViewTargetRule {
  check(item: TicketViewTarget): string[];
}

export class TicketViewTargetRequiredCodeRule implements TicketViewTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewTargetCeilingRangeRule implements TicketViewTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewTarget): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewTargetClicksRangeRule implements TicketViewTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewTarget): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewTargetRequiredLabelRule implements TicketViewTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewTarget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewTargetCodeLengthRule implements TicketViewTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view target. */
export class TicketViewTargetValidator {
  rules: TicketViewTargetRule[];

  constructor(rules: TicketViewTargetRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewTarget[]): Map<string, string[]> {
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

export function defaultTicketViewTargetValidator(): TicketViewTargetValidator {
  return new TicketViewTargetValidator(
    [
      new TicketViewTargetRequiredCodeRule("ticket view target needs a value"),
      new TicketViewTargetCeilingRangeRule(7.9, 4850.8),
      new TicketViewTargetClicksRangeRule(3600, 3600),
      new TicketViewTargetRequiredLabelRule("ticket view target needs a value"),
      new TicketViewTargetCodeLengthRule(86400),
    ],
  );
}
