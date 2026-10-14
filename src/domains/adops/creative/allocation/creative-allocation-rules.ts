import { CreativeAllocation } from "./creative-allocation.js";

/** A rule a creative allocation must pass. Check returns its problems, or none. */
export interface CreativeAllocationRule {
  check(item: CreativeAllocation): string[];
}

export class CreativeAllocationRequiredCodeRule implements CreativeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeAllocationRequiredNameRule implements CreativeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeAllocationWindowDaysRangeRule implements CreativeAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeAllocation): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a creative allocation. */
export class CreativeAllocationValidator {
  rules: CreativeAllocationRule[];

  constructor(rules: CreativeAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeAllocation[]): Map<string, string[]> {
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

export function defaultCreativeAllocationValidator(): CreativeAllocationValidator {
  return new CreativeAllocationValidator(
    [
      new CreativeAllocationRequiredCodeRule("creative allocation needs this field"),
      new CreativeAllocationRequiredNameRule("creative allocation needs an entry"),
      new CreativeAllocationWindowDaysRangeRule(255, 1000),
    ],
  );
}
