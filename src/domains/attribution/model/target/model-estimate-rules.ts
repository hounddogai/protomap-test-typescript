import { ModelEstimate } from "./model-estimate.js";

/** A rule a model estimate must pass. Check returns its problems, or none. */
export interface ModelEstimateRule {
  check(item: ModelEstimate): string[];
}

export class ModelEstimateCategoryLengthRule implements ModelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelEstimate): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelEstimateCodeLengthRule implements ModelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelEstimateCodePrefixRule implements ModelEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelEstimateRequiredCodeRule implements ModelEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model estimate. */
export class ModelEstimateValidator {
  rules: ModelEstimateRule[];

  constructor(rules: ModelEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ModelEstimate): string[] {
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

  requireValid(item: ModelEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelEstimate[]): Map<string, string[]> {
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

export function defaultModelEstimateValidator(): ModelEstimateValidator {
  return new ModelEstimateValidator(
    [
      new ModelEstimateCategoryLengthRule(80),
      new ModelEstimateCodeLengthRule(1000),
      new ModelEstimateCodePrefixRule("REF"),
      new ModelEstimateRequiredCodeRule("model estimate needs a value"),
    ],
  );
}
