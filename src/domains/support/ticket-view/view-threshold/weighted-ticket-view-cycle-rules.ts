import * as text from "../../../../kit/text.js";
import { WeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

/** A rule a weighted ticket view cycle must pass. Check returns its problems, or none. */
export interface WeightedTicketViewCycleRule {
  check(item: WeightedTicketViewCycle): string[];
}

export class WeightedTicketViewCycleMaximumRangeRule implements WeightedTicketViewCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedTicketViewCycle): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedTicketViewCycleAllowedChannelRule implements WeightedTicketViewCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedTicketViewCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is blocked`];
    return [];
  }
}

export class WeightedTicketViewCycleCodePrefixRule implements WeightedTicketViewCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedTicketViewCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted ticket view cycle. */
export class WeightedTicketViewCycleValidator {
  rules: WeightedTicketViewCycleRule[];

  constructor(rules: WeightedTicketViewCycleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTicketViewCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedTicketViewCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTicketViewCycle[]): Map<string, string[]> {
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

export function defaultWeightedTicketViewCycleValidator(): WeightedTicketViewCycleValidator {
  return new WeightedTicketViewCycleValidator(
    [
      new WeightedTicketViewCycleMaximumRangeRule(8.8, 3560.8),
      new WeightedTicketViewCycleAllowedChannelRule(["weighted", "legacy"]),
      new WeightedTicketViewCycleCodePrefixRule("REF"),
    ],
  );
}
