import { CreativePlan } from "./creative-plan.js";

/** A rule a creative plan must pass. Check returns its problems, or none. */
export interface CreativePlanRule {
  check(item: CreativePlan): string[];
}

export class CreativePlanRequiredCodeRule implements CreativePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativePlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativePlanCodePrefixRule implements CreativePlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativePlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativePlanVersionRangeRule implements CreativePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativePlan): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a creative plan. */
export class CreativePlanValidator {
  rules: CreativePlanRule[];

  constructor(rules: CreativePlanRule[]) {
    this.rules = rules;
  }

  validate(item: CreativePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativePlan[]): Map<string, string[]> {
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

export function defaultCreativePlanValidator(): CreativePlanValidator {
  return new CreativePlanValidator(
    [
      new CreativePlanRequiredCodeRule("creative plan needs this field"),
      new CreativePlanCodePrefixRule("REF"),
      new CreativePlanVersionRangeRule(32, 1000),
    ],
  );
}
