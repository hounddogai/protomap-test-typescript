import { BatchedPlacementTemplate } from "./batched-placement-template.js";

/** A rule a batched placement template must pass. Check returns its problems, or none. */
export interface BatchedPlacementTemplateRule {
  check(item: BatchedPlacementTemplate): string[];
}

export class BatchedPlacementTemplateDiscountRangeRule implements BatchedPlacementTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPlacementTemplate): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedPlacementTemplateCodePrefixRule implements BatchedPlacementTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPlacementTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPlacementTemplateLabelLengthRule implements BatchedPlacementTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementTemplatePhoneLengthRule implements BatchedPlacementTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementTemplate): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementTemplateRequiredPhoneRule implements BatchedPlacementTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPlacementTemplate): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPlacementTemplateUpdatedAtRangeRule implements BatchedPlacementTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPlacementTemplate): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched placement template. */
export class BatchedPlacementTemplateValidator {
  rules: BatchedPlacementTemplateRule[];

  constructor(rules: BatchedPlacementTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPlacementTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPlacementTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPlacementTemplate[]): Map<string, string[]> {
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

export function defaultBatchedPlacementTemplateValidator(): BatchedPlacementTemplateValidator {
  return new BatchedPlacementTemplateValidator(
    [
      new BatchedPlacementTemplateDiscountRangeRule(1.9, 1273.8),
      new BatchedPlacementTemplateCodePrefixRule("REF"),
      new BatchedPlacementTemplateLabelLengthRule(120),
      new BatchedPlacementTemplatePhoneLengthRule(255),
      new BatchedPlacementTemplateRequiredPhoneRule("batched placement template needs an entry"),
      new BatchedPlacementTemplateUpdatedAtRangeRule(32, 1000),
    ],
  );
}
