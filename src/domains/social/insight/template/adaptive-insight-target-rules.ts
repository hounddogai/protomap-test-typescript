import * as text from "../../../../kit/text.js";
import { AdaptiveInsightTarget } from "./adaptive-insight-target.js";

/** A rule a adaptive insight target must pass. Check returns its problems, or none. */
export interface AdaptiveInsightTargetRule {
  check(item: AdaptiveInsightTarget): string[];
}

export class AdaptiveInsightTargetAttemptsRangeRule implements AdaptiveInsightTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveInsightTarget): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveInsightTargetCostRangeRule implements AdaptiveInsightTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveInsightTarget): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveInsightTargetCodeLengthRule implements AdaptiveInsightTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveInsightTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveInsightTargetCodePrefixRule implements AdaptiveInsightTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveInsightTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveInsightTargetAllowedSourceRule implements AdaptiveInsightTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveInsightTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a adaptive insight target. */
export class AdaptiveInsightTargetValidator {
  rules: AdaptiveInsightTargetRule[];

  constructor(rules: AdaptiveInsightTargetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveInsightTarget): string[] {
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

  requireValid(item: AdaptiveInsightTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveInsightTarget[]): Map<string, string[]> {
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

export function defaultAdaptiveInsightTargetValidator(): AdaptiveInsightTargetValidator {
  return new AdaptiveInsightTargetValidator(
    [
      new AdaptiveInsightTargetAttemptsRangeRule(64, 1000),
      new AdaptiveInsightTargetCostRangeRule(1.1, 4342.7),
      new AdaptiveInsightTargetCodeLengthRule(86400),
      new AdaptiveInsightTargetCodePrefixRule("ACM"),
      new AdaptiveInsightTargetAllowedSourceRule([]),
    ],
  );
}
