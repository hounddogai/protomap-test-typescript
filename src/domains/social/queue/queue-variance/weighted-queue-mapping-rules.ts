import * as text from "../../../../kit/text.js";
import { WeightedQueueMapping } from "./weighted-queue-mapping.js";

/** A rule a weighted queue mapping must pass. Check returns its problems, or none. */
export interface WeightedQueueMappingRule {
  check(item: WeightedQueueMapping): string[];
}

export class WeightedQueueMappingCodeLengthRule implements WeightedQueueMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedQueueMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedQueueMappingChannelLengthRule implements WeightedQueueMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedQueueMapping): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedQueueMappingQuantityRangeRule implements WeightedQueueMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedQueueMapping): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedQueueMappingAllowedCodeRule implements WeightedQueueMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedQueueMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class WeightedQueueMappingRequiredChannelRule implements WeightedQueueMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedQueueMapping): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted queue mapping. */
export class WeightedQueueMappingValidator {
  rules: WeightedQueueMappingRule[];

  constructor(rules: WeightedQueueMappingRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedQueueMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedQueueMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedQueueMapping[]): Map<string, string[]> {
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

export function defaultWeightedQueueMappingValidator(): WeightedQueueMappingValidator {
  return new WeightedQueueMappingValidator(
    [
      new WeightedQueueMappingCodeLengthRule(86400),
      new WeightedQueueMappingChannelLengthRule(255),
      new WeightedQueueMappingQuantityRangeRule(16, 64),
      new WeightedQueueMappingAllowedCodeRule(["weighted", "seasonal", "manual"]),
      new WeightedQueueMappingRequiredChannelRule("weighted queue mapping needs an entry"),
    ],
  );
}
