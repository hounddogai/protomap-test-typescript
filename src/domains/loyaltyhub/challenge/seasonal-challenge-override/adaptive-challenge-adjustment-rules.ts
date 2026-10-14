import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeAdjustment } from "./adaptive-challenge-adjustment.js";

/** A rule a adaptive challenge adjustment must pass. Check returns its problems, or none. */
export interface AdaptiveChallengeAdjustmentRule {
  check(item: AdaptiveChallengeAdjustment): string[];
}

export class AdaptiveChallengeAdjustmentQuantityRangeRule implements AdaptiveChallengeAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveChallengeAdjustment): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveChallengeAdjustmentAllowedCodeRule implements AdaptiveChallengeAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveChallengeAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class AdaptiveChallengeAdjustmentSendAtRangeRule implements AdaptiveChallengeAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveChallengeAdjustment): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveChallengeAdjustmentTitleLengthRule implements AdaptiveChallengeAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveChallengeAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveChallengeAdjustmentRequiredTitleRule implements AdaptiveChallengeAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveChallengeAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive challenge adjustment. */
export class AdaptiveChallengeAdjustmentValidator {
  rules: AdaptiveChallengeAdjustmentRule[];

  constructor(rules: AdaptiveChallengeAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveChallengeAdjustment): string[] {
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

  requireValid(item: AdaptiveChallengeAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveChallengeAdjustment[]): Map<string, string[]> {
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

export function defaultAdaptiveChallengeAdjustmentValidator(): AdaptiveChallengeAdjustmentValidator {
  return new AdaptiveChallengeAdjustmentValidator(
    [
      new AdaptiveChallengeAdjustmentQuantityRangeRule(64, 80),
      new AdaptiveChallengeAdjustmentAllowedCodeRule([]),
      new AdaptiveChallengeAdjustmentSendAtRangeRule(3600, 86400),
      new AdaptiveChallengeAdjustmentTitleLengthRule(64),
      new AdaptiveChallengeAdjustmentRequiredTitleRule("adaptive challenge adjustment needs a value"),
    ],
  );
}
