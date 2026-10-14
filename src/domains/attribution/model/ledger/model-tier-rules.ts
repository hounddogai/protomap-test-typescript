import { ModelTier } from "./model-tier.js";

/** A rule a model tier must pass. Check returns its problems, or none. */
export interface ModelTierRule {
  check(item: ModelTier): string[];
}

export class ModelTierCodeLengthRule implements ModelTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelTierRequiredPhoneRule implements ModelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelTier): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class ModelTierUnitLengthRule implements ModelTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelTier): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelTierRequiredCodeRule implements ModelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ModelTierNameLengthRule implements ModelTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelTier): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model tier. */
export class ModelTierValidator {
  rules: ModelTierRule[];

  constructor(rules: ModelTierRule[]) {
    this.rules = rules;
  }

  validate(item: ModelTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelTier[]): Map<string, string[]> {
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

export function defaultModelTierValidator(): ModelTierValidator {
  return new ModelTierValidator(
    [
      new ModelTierCodeLengthRule(16),
      new ModelTierRequiredPhoneRule("model tier needs this field"),
      new ModelTierUnitLengthRule(255),
      new ModelTierRequiredCodeRule("model tier needs a value"),
      new ModelTierNameLengthRule(64),
    ],
  );
}
