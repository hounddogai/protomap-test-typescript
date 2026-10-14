import * as text from "../../../../kit/text.js";
import { FallbackSlaOverride } from "./fallback-sla-override.js";

/** A rule a fallback sla override must pass. Check returns its problems, or none. */
export interface FallbackSlaOverrideRule {
  check(item: FallbackSlaOverride): string[];
}

export class FallbackSlaOverrideDiscountRangeRule implements FallbackSlaOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSlaOverride): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackSlaOverrideRequiredChannelRule implements FallbackSlaOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSlaOverride): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSlaOverrideAllowedSourceRule implements FallbackSlaOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackSlaOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is below minimum`];
    return [];
  }
}

export class FallbackSlaOverrideSourceLengthRule implements FallbackSlaOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSlaOverride): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSlaOverrideRequiredSourceRule implements FallbackSlaOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSlaOverride): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback sla override. */
export class FallbackSlaOverrideValidator {
  rules: FallbackSlaOverrideRule[];

  constructor(rules: FallbackSlaOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSlaOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSlaOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSlaOverride[]): Map<string, string[]> {
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

export function defaultFallbackSlaOverrideValidator(): FallbackSlaOverrideValidator {
  return new FallbackSlaOverrideValidator(
    [
      new FallbackSlaOverrideDiscountRangeRule(6.1, 4448.4),
      new FallbackSlaOverrideRequiredChannelRule("fallback sla override needs this field"),
      new FallbackSlaOverrideAllowedSourceRule(["regional", "strict", "adaptive"]),
      new FallbackSlaOverrideSourceLengthRule(255),
      new FallbackSlaOverrideRequiredSourceRule("fallback sla override needs this field"),
    ],
  );
}
