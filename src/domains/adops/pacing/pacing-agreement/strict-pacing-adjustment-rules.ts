import * as text from "../../../../kit/text.js";
import { StrictPacingAdjustment } from "./strict-pacing-adjustment.js";

/** A rule a strict pacing adjustment must pass. Check returns its problems, or none. */
export interface StrictPacingAdjustmentRule {
  check(item: StrictPacingAdjustment): string[];
}

export class StrictPacingAdjustmentClicksRangeRule implements StrictPacingAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPacingAdjustment): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictPacingAdjustmentApprovedGuardRule implements StrictPacingAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictPacingAdjustment): string[] {
    if (item.approved && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class StrictPacingAdjustmentCodePrefixRule implements StrictPacingAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictPacingAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictPacingAdjustmentRequiredCodeRule implements StrictPacingAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPacingAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPacingAdjustmentCodeLengthRule implements StrictPacingAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPacingAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPacingAdjustmentAllowedCampaignRefRule implements StrictPacingAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictPacingAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is duplicated`];
    return [];
  }
}

/** Runs every rule of a strict pacing adjustment. */
export class StrictPacingAdjustmentValidator {
  rules: StrictPacingAdjustmentRule[];

  constructor(rules: StrictPacingAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPacingAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPacingAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPacingAdjustment[]): Map<string, string[]> {
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

export function defaultStrictPacingAdjustmentValidator(): StrictPacingAdjustmentValidator {
  return new StrictPacingAdjustmentValidator(
    [
      new StrictPacingAdjustmentClicksRangeRule(80, 86400),
      new StrictPacingAdjustmentApprovedGuardRule(255),
      new StrictPacingAdjustmentCodePrefixRule("OPS"),
      new StrictPacingAdjustmentRequiredCodeRule("strict pacing adjustment needs an entry"),
      new StrictPacingAdjustmentCodeLengthRule(86400),
      new StrictPacingAdjustmentAllowedCampaignRefRule(["weighted", "lenient"]),
    ],
  );
}
