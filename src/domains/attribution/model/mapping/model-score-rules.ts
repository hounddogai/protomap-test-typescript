import { ModelScore } from "./model-score.js";

/** A rule a model score must pass. Check returns its problems, or none. */
export interface ModelScoreRule {
  check(item: ModelScore): string[];
}

export class ModelScoreRequiredLabelRule implements ModelScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ModelScoreCreatedAtRangeRule implements ModelScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelScore): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelScoreCodePrefixRule implements ModelScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a model score. */
export class ModelScoreValidator {
  rules: ModelScoreRule[];

  constructor(rules: ModelScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ModelScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelScore[]): Map<string, string[]> {
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

export function defaultModelScoreValidator(): ModelScoreValidator {
  return new ModelScoreValidator(
    [
      new ModelScoreRequiredLabelRule("model score needs an entry"),
      new ModelScoreCreatedAtRangeRule(16, 3600),
      new ModelScoreCodePrefixRule("ACM"),
    ],
  );
}
