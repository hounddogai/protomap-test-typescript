import * as text from "../../../../kit/text.js";
import { AdaptiveFlightMapping } from "./adaptive-flight-mapping.js";

/** A rule a adaptive flight mapping must pass. Check returns its problems, or none. */
export interface AdaptiveFlightMappingRule {
  check(item: AdaptiveFlightMapping): string[];
}

export class AdaptiveFlightMappingRequiredNameRule implements AdaptiveFlightMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFlightMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFlightMappingAllowedCodeRule implements AdaptiveFlightMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveFlightMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class AdaptiveFlightMappingOpenRateRangeRule implements AdaptiveFlightMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFlightMapping): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive flight mapping. */
export class AdaptiveFlightMappingValidator {
  rules: AdaptiveFlightMappingRule[];

  constructor(rules: AdaptiveFlightMappingRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFlightMapping): string[] {
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

  requireValid(item: AdaptiveFlightMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFlightMapping[]): Map<string, string[]> {
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

export function defaultAdaptiveFlightMappingValidator(): AdaptiveFlightMappingValidator {
  return new AdaptiveFlightMappingValidator(
    [
      new AdaptiveFlightMappingRequiredNameRule("adaptive flight mapping needs this field"),
      new AdaptiveFlightMappingAllowedCodeRule(["tiered", "adaptive", "default"]),
      new AdaptiveFlightMappingOpenRateRangeRule(3.7, 790.3),
    ],
  );
}
