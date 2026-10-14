import { WeightedInviteTier } from "./weighted-invite-tier.js";

/** A rule a weighted invite tier must pass. Check returns its problems, or none. */
export interface WeightedInviteTierRule {
  check(item: WeightedInviteTier): string[];
}

export class WeightedInviteTierPriorityRangeRule implements WeightedInviteTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedInviteTier): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedInviteTierCodePrefixRule implements WeightedInviteTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedInviteTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedInviteTierRequiredNameRule implements WeightedInviteTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInviteTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedInviteTierRequiredCodeRule implements WeightedInviteTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInviteTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedInviteTierBudgetRangeRule implements WeightedInviteTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedInviteTier): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a weighted invite tier. */
export class WeightedInviteTierValidator {
  rules: WeightedInviteTierRule[];

  constructor(rules: WeightedInviteTierRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedInviteTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedInviteTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedInviteTier[]): Map<string, string[]> {
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

export function defaultWeightedInviteTierValidator(): WeightedInviteTierValidator {
  return new WeightedInviteTierValidator(
    [
      new WeightedInviteTierPriorityRangeRule(64, 80),
      new WeightedInviteTierCodePrefixRule("X"),
      new WeightedInviteTierRequiredNameRule("weighted invite tier needs a value"),
      new WeightedInviteTierRequiredCodeRule("weighted invite tier needs this field"),
      new WeightedInviteTierBudgetRangeRule(8.4, 1031.4),
    ],
  );
}
