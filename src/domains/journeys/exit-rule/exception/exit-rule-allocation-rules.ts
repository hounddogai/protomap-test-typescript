import { ExitRuleAllocation } from "./exit-rule-allocation.js";

/** A rule a exit rule allocation must pass. Check returns its problems, or none. */
export interface ExitRuleAllocationRule {
  check(item: ExitRuleAllocation): string[];
}

export class ExitRuleAllocationRequiredTitleRule implements ExitRuleAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleAllocation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleAllocationCodePrefixRule implements ExitRuleAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleAllocationActiveGuardRule implements ExitRuleAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ExitRuleAllocation): string[] {
    if (item.active && item.floorValue > this.limit) return [`floor value ${item.floorValue} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ExitRuleAllocationTitleLengthRule implements ExitRuleAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleAllocationFloorValueRangeRule implements ExitRuleAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleAllocation): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a exit rule allocation. */
export class ExitRuleAllocationValidator {
  rules: ExitRuleAllocationRule[];

  constructor(rules: ExitRuleAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleAllocation[]): Map<string, string[]> {
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

export function defaultExitRuleAllocationValidator(): ExitRuleAllocationValidator {
  return new ExitRuleAllocationValidator(
    [
      new ExitRuleAllocationRequiredTitleRule("exit rule allocation needs a value"),
      new ExitRuleAllocationCodePrefixRule("X"),
      new ExitRuleAllocationActiveGuardRule(3.2),
      new ExitRuleAllocationTitleLengthRule(64),
      new ExitRuleAllocationFloorValueRangeRule(0.5, 412.8),
    ],
  );
}
