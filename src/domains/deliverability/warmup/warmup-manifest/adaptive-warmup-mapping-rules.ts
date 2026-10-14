import * as text from "../../../../kit/text.js";
import { AdaptiveWarmupMapping } from "./adaptive-warmup-mapping.js";

/** A rule a adaptive warmup mapping must pass. Check returns its problems, or none. */
export interface AdaptiveWarmupMappingRule {
  check(item: AdaptiveWarmupMapping): string[];
}

export class AdaptiveWarmupMappingTitleLengthRule implements AdaptiveWarmupMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWarmupMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveWarmupMappingRequiredNameRule implements AdaptiveWarmupMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWarmupMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWarmupMappingRequiredTitleRule implements AdaptiveWarmupMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWarmupMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWarmupMappingAllowedSourceRule implements AdaptiveWarmupMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveWarmupMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is above maximum`];
    return [];
  }
}

/** Runs every rule of a adaptive warmup mapping. */
export class AdaptiveWarmupMappingValidator {
  rules: AdaptiveWarmupMappingRule[];

  constructor(rules: AdaptiveWarmupMappingRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveWarmupMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveWarmupMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveWarmupMapping[]): Map<string, string[]> {
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

export function defaultAdaptiveWarmupMappingValidator(): AdaptiveWarmupMappingValidator {
  return new AdaptiveWarmupMappingValidator(
    [
      new AdaptiveWarmupMappingTitleLengthRule(120),
      new AdaptiveWarmupMappingRequiredNameRule("adaptive warmup mapping needs a value"),
      new AdaptiveWarmupMappingRequiredTitleRule("adaptive warmup mapping needs a value"),
      new AdaptiveWarmupMappingAllowedSourceRule(["manual"]),
    ],
  );
}
