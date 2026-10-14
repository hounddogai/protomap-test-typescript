import * as text from "../../../../kit/text.js";
import { FunnelScore } from "./funnel-score.js";

/** A rule a funnel score must pass. Check returns its problems, or none. */
export interface FunnelScoreRule {
  check(item: FunnelScore): string[];
}

export class FunnelScoreRequiredLocaleRule implements FunnelScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelScore): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelScoreLabelLengthRule implements FunnelScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelScoreCodePrefixRule implements FunnelScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FunnelScoreAllowedCodeRule implements FunnelScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a funnel score. */
export class FunnelScoreValidator {
  rules: FunnelScoreRule[];

  constructor(rules: FunnelScoreRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelScore[]): Map<string, string[]> {
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

export function defaultFunnelScoreValidator(): FunnelScoreValidator {
  return new FunnelScoreValidator(
    [
      new FunnelScoreRequiredLocaleRule("funnel score needs a value"),
      new FunnelScoreLabelLengthRule(3600),
      new FunnelScoreCodePrefixRule("OPS"),
      new FunnelScoreAllowedCodeRule(["legacy", "default", "regional"]),
    ],
  );
}
