import * as text from "../../../../kit/text.js";
import { FunnelEstimate } from "./funnel-estimate.js";

/** A rule a funnel estimate must pass. Check returns its problems, or none. */
export interface FunnelEstimateRule {
  check(item: FunnelEstimate): string[];
}

export class FunnelEstimateRegionLengthRule implements FunnelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelEstimate): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelEstimateAllowedRegionRule implements FunnelEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is too long`];
    return [];
  }
}

export class FunnelEstimateNameLengthRule implements FunnelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelEstimateChecksumLengthRule implements FunnelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelEstimate): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelEstimateCodeLengthRule implements FunnelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel estimate. */
export class FunnelEstimateValidator {
  rules: FunnelEstimateRule[];

  constructor(rules: FunnelEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelEstimate): string[] {
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

  requireValid(item: FunnelEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelEstimate[]): Map<string, string[]> {
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

export function defaultFunnelEstimateValidator(): FunnelEstimateValidator {
  return new FunnelEstimateValidator(
    [
      new FunnelEstimateRegionLengthRule(3600),
      new FunnelEstimateAllowedRegionRule(["weighted", "manual", "global"]),
      new FunnelEstimateNameLengthRule(1000),
      new FunnelEstimateChecksumLengthRule(16),
      new FunnelEstimateCodeLengthRule(80),
    ],
  );
}
