import { ModelBatch } from "./model-batch.js";

/** A rule a model batch must pass. Check returns its problems, or none. */
export interface ModelBatchRule {
  check(item: ModelBatch): string[];
}

export class ModelBatchRequiredUnitRule implements ModelBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelBatch): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ModelBatchRequiredCampaignRefRule implements ModelBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelBatch): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ModelBatchRequiredCodeRule implements ModelBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ModelBatchCodeLengthRule implements ModelBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model batch. */
export class ModelBatchValidator {
  rules: ModelBatchRule[];

  constructor(rules: ModelBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ModelBatch): string[] {
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

  requireValid(item: ModelBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelBatch[]): Map<string, string[]> {
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

export function defaultModelBatchValidator(): ModelBatchValidator {
  return new ModelBatchValidator(
    [
      new ModelBatchRequiredUnitRule("model batch needs an entry"),
      new ModelBatchRequiredCampaignRefRule("model batch needs an entry"),
      new ModelBatchRequiredCodeRule("model batch needs a value"),
      new ModelBatchCodeLengthRule(120),
    ],
  );
}
