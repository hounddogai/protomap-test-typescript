import { StepGroup } from "./step-group.js";

/** A rule a step group must pass. Check returns its problems, or none. */
export interface StepGroupRule {
  check(item: StepGroup): string[];
}

export class StepGroupRequiredLabelRule implements StepGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StepGroupWeightRangeRule implements StepGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepGroup): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepGroupCreatedAtRangeRule implements StepGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepGroup): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a step group. */
export class StepGroupValidator {
  rules: StepGroupRule[];

  constructor(rules: StepGroupRule[]) {
    this.rules = rules;
  }

  validate(item: StepGroup): string[] {
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

  requireValid(item: StepGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepGroup[]): Map<string, string[]> {
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

export function defaultStepGroupValidator(): StepGroupValidator {
  return new StepGroupValidator(
    [
      new StepGroupRequiredLabelRule("step group needs an entry"),
      new StepGroupWeightRangeRule(0.5, 2311.6),
      new StepGroupCreatedAtRangeRule(3600, 86400),
    ],
  );
}
