import * as text from "../../../../kit/text.js";
import { AdaptiveTierMapping } from "./adaptive-tier-mapping.js";

/** A rule a adaptive tier mapping must pass. Check returns its problems, or none. */
export interface AdaptiveTierMappingRule {
  check(item: AdaptiveTierMapping): string[];
}

export class AdaptiveTierMappingCodeLengthRule implements AdaptiveTierMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveTierMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveTierMappingRequiredLabelRule implements AdaptiveTierMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTierMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTierMappingAllowedCodeRule implements AdaptiveTierMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveTierMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

/** Runs every rule of a adaptive tier mapping. */
export class AdaptiveTierMappingValidator {
  rules: AdaptiveTierMappingRule[];

  constructor(rules: AdaptiveTierMappingRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveTierMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveTierMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveTierMapping[]): Map<string, string[]> {
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

export function defaultAdaptiveTierMappingValidator(): AdaptiveTierMappingValidator {
  return new AdaptiveTierMappingValidator(
    [
      new AdaptiveTierMappingCodeLengthRule(120),
      new AdaptiveTierMappingRequiredLabelRule("adaptive tier mapping needs this field"),
      new AdaptiveTierMappingAllowedCodeRule([]),
    ],
  );
}
