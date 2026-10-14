import * as text from "../../../../kit/text.js";
import { ModelThreshold } from "./model-threshold.js";

/** A rule a model threshold must pass. Check returns its problems, or none. */
export interface ModelThresholdRule {
  check(item: ModelThreshold): string[];
}

export class ModelThresholdCodeLengthRule implements ModelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelThresholdAllowedCodeRule implements ModelThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class ModelThresholdRequiredLabelRule implements ModelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ModelThresholdTagsLimitRule implements ModelThresholdRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ModelThreshold): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ModelThresholdQuantityRangeRule implements ModelThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelThreshold): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a model threshold. */
export class ModelThresholdValidator {
  rules: ModelThresholdRule[];

  constructor(rules: ModelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ModelThreshold): string[] {
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

  requireValid(item: ModelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelThreshold[]): Map<string, string[]> {
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

export function defaultModelThresholdValidator(): ModelThresholdValidator {
  return new ModelThresholdValidator(
    [
      new ModelThresholdCodeLengthRule(16),
      new ModelThresholdAllowedCodeRule(["seasonal", "fallback"]),
      new ModelThresholdRequiredLabelRule("model threshold needs this field"),
      new ModelThresholdTagsLimitRule(120, ["tiered"]),
      new ModelThresholdQuantityRangeRule(80, 120),
    ],
  );
}
