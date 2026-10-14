import * as text from "../../../../kit/text.js";
import { WeightedDomainBundle } from "./weighted-domain-bundle.js";

/** A rule a weighted domain bundle must pass. Check returns its problems, or none. */
export interface WeightedDomainBundleRule {
  check(item: WeightedDomainBundle): string[];
}

export class WeightedDomainBundleRegionLengthRule implements WeightedDomainBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedDomainBundle): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedDomainBundleAllowedTitleRule implements WeightedDomainBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedDomainBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class WeightedDomainBundleRequiredTitleRule implements WeightedDomainBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDomainBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDomainBundleRequiredRegionRule implements WeightedDomainBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDomainBundle): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted domain bundle. */
export class WeightedDomainBundleValidator {
  rules: WeightedDomainBundleRule[];

  constructor(rules: WeightedDomainBundleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedDomainBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedDomainBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedDomainBundle[]): Map<string, string[]> {
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

export function defaultWeightedDomainBundleValidator(): WeightedDomainBundleValidator {
  return new WeightedDomainBundleValidator(
    [
      new WeightedDomainBundleRegionLengthRule(120),
      new WeightedDomainBundleAllowedTitleRule(["fallback"]),
      new WeightedDomainBundleRequiredTitleRule("weighted domain bundle needs an entry"),
      new WeightedDomainBundleRequiredRegionRule("weighted domain bundle needs an entry"),
    ],
  );
}
