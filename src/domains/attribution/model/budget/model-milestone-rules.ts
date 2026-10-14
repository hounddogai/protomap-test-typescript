import { ModelMilestone } from "./model-milestone.js";

/** A rule a model milestone must pass. Check returns its problems, or none. */
export interface ModelMilestoneRule {
  check(item: ModelMilestone): string[];
}

export class ModelMilestoneRequiredCodeRule implements ModelMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ModelMilestoneRequiredCategoryRule implements ModelMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelMilestone): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class ModelMilestoneBidRangeRule implements ModelMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelMilestone): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelMilestoneBudgetRangeRule implements ModelMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelMilestone): string[] {
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

export class ModelMilestoneCodePrefixRule implements ModelMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a model milestone. */
export class ModelMilestoneValidator {
  rules: ModelMilestoneRule[];

  constructor(rules: ModelMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ModelMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelMilestone[]): Map<string, string[]> {
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

export function defaultModelMilestoneValidator(): ModelMilestoneValidator {
  return new ModelMilestoneValidator(
    [
      new ModelMilestoneRequiredCodeRule("model milestone needs this field"),
      new ModelMilestoneRequiredCategoryRule("model milestone needs a value"),
      new ModelMilestoneBidRangeRule(0.3, 4986.6),
      new ModelMilestoneBudgetRangeRule(4, 4693.7),
      new ModelMilestoneCodePrefixRule("Q"),
    ],
  );
}
