import * as text from "../../../../kit/text.js";
import { FunnelVariance } from "./funnel-variance.js";

/** A rule a funnel variance must pass. Check returns its problems, or none. */
export interface FunnelVarianceRule {
  check(item: FunnelVariance): string[];
}

export class FunnelVarianceCodeLengthRule implements FunnelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelVarianceRequiredCodeRule implements FunnelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelVarianceMaximumRangeRule implements FunnelVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelVariance): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelVarianceAudienceIdLengthRule implements FunnelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelVariance): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelVarianceAllowedNameRule implements FunnelVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

/** Runs every rule of a funnel variance. */
export class FunnelVarianceValidator {
  rules: FunnelVarianceRule[];

  constructor(rules: FunnelVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelVariance): string[] {
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

  requireValid(item: FunnelVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelVariance[]): Map<string, string[]> {
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

export function defaultFunnelVarianceValidator(): FunnelVarianceValidator {
  return new FunnelVarianceValidator(
    [
      new FunnelVarianceCodeLengthRule(80),
      new FunnelVarianceRequiredCodeRule("funnel variance needs this field"),
      new FunnelVarianceMaximumRangeRule(5.4, 1976.2),
      new FunnelVarianceAudienceIdLengthRule(3600),
      new FunnelVarianceAllowedNameRule(["rolling"]),
    ],
  );
}
