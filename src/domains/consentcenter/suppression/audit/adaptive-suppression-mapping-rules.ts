import * as text from "../../../../kit/text.js";
import { AdaptiveSuppressionMapping } from "./adaptive-suppression-mapping.js";

/** A rule a adaptive suppression mapping must pass. Check returns its problems, or none. */
export interface AdaptiveSuppressionMappingRule {
  check(item: AdaptiveSuppressionMapping): string[];
}

export class AdaptiveSuppressionMappingRequiredChecksumRule implements AdaptiveSuppressionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSuppressionMapping): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSuppressionMappingCodeLengthRule implements AdaptiveSuppressionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSuppressionMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveSuppressionMappingAllowedCodeRule implements AdaptiveSuppressionMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveSuppressionMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class AdaptiveSuppressionMappingCostRangeRule implements AdaptiveSuppressionMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSuppressionMapping): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveSuppressionMappingRequiredCodeRule implements AdaptiveSuppressionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSuppressionMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSuppressionMappingCodePrefixRule implements AdaptiveSuppressionMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveSuppressionMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive suppression mapping. */
export class AdaptiveSuppressionMappingValidator {
  rules: AdaptiveSuppressionMappingRule[];

  constructor(rules: AdaptiveSuppressionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSuppressionMapping): string[] {
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

  requireValid(item: AdaptiveSuppressionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSuppressionMapping[]): Map<string, string[]> {
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

export function defaultAdaptiveSuppressionMappingValidator(): AdaptiveSuppressionMappingValidator {
  return new AdaptiveSuppressionMappingValidator(
    [
      new AdaptiveSuppressionMappingRequiredChecksumRule("adaptive suppression mapping needs an entry"),
      new AdaptiveSuppressionMappingCodeLengthRule(32),
      new AdaptiveSuppressionMappingAllowedCodeRule(["global"]),
      new AdaptiveSuppressionMappingCostRangeRule(0, 453.7),
      new AdaptiveSuppressionMappingRequiredCodeRule("adaptive suppression mapping needs this field"),
      new AdaptiveSuppressionMappingCodePrefixRule("REF"),
    ],
  );
}
