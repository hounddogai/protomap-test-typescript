import * as text from "../../../../kit/text.js";
import { WarmupRule } from "./warmup-rule.js";

/** A rule a warmup rule must pass. Check returns its problems, or none. */
export interface WarmupRuleRule {
  check(item: WarmupRule): string[];
}

export class WarmupRuleAllowedCodeRule implements WarmupRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class WarmupRuleRevisionRangeRule implements WarmupRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupRule): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupRuleCodeLengthRule implements WarmupRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupRuleCodePrefixRule implements WarmupRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupRuleStartsAtRangeRule implements WarmupRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupRule): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a warmup rule. */
export class WarmupRuleValidator {
  rules: WarmupRuleRule[];

  constructor(rules: WarmupRuleRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupRule[]): Map<string, string[]> {
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

export function defaultWarmupRuleValidator(): WarmupRuleValidator {
  return new WarmupRuleValidator(
    [
      new WarmupRuleAllowedCodeRule([]),
      new WarmupRuleRevisionRangeRule(120, 1000),
      new WarmupRuleCodeLengthRule(64),
      new WarmupRuleCodePrefixRule("OPS"),
      new WarmupRuleStartsAtRangeRule(255, 255),
    ],
  );
}
