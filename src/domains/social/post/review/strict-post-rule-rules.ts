import { StrictPostRule } from "./strict-post-rule.js";

/** A rule a strict post rule must pass. Check returns its problems, or none. */
export interface StrictPostRuleRule {
  check(item: StrictPostRule): string[];
}

export class StrictPostRuleLabelLengthRule implements StrictPostRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPostRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPostRuleCodePrefixRule implements StrictPostRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictPostRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictPostRuleRequiredOwnerIdRule implements StrictPostRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPostRule): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPostRuleRequiredCodeRule implements StrictPostRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPostRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPostRuleFloorValueRangeRule implements StrictPostRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPostRule): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict post rule. */
export class StrictPostRuleValidator {
  rules: StrictPostRuleRule[];

  constructor(rules: StrictPostRuleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPostRule): string[] {
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

  requireValid(item: StrictPostRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPostRule[]): Map<string, string[]> {
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

export function defaultStrictPostRuleValidator(): StrictPostRuleValidator {
  return new StrictPostRuleValidator(
    [
      new StrictPostRuleLabelLengthRule(255),
      new StrictPostRuleCodePrefixRule("REF"),
      new StrictPostRuleRequiredOwnerIdRule("strict post rule needs a value"),
      new StrictPostRuleRequiredCodeRule("strict post rule needs an entry"),
      new StrictPostRuleFloorValueRangeRule(1.8, 3932.6),
    ],
  );
}
