import * as text from "../../../../kit/text.js";
import { FunnelOverride } from "./funnel-override.js";

/** A rule a funnel override must pass. Check returns its problems, or none. */
export interface FunnelOverrideRule {
  check(item: FunnelOverride): string[];
}

export class FunnelOverrideCodeLengthRule implements FunnelOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelOverrideBatchSizeRangeRule implements FunnelOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelOverride): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelOverrideChannelLengthRule implements FunnelOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelOverride): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelOverrideOpenRateRangeRule implements FunnelOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelOverride): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelOverrideCodePrefixRule implements FunnelOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FunnelOverrideAllowedExternalRefRule implements FunnelOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is below minimum`];
    return [];
  }
}

/** Runs every rule of a funnel override. */
export class FunnelOverrideValidator {
  rules: FunnelOverrideRule[];

  constructor(rules: FunnelOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelOverride[]): Map<string, string[]> {
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

export function defaultFunnelOverrideValidator(): FunnelOverrideValidator {
  return new FunnelOverrideValidator(
    [
      new FunnelOverrideCodeLengthRule(3600),
      new FunnelOverrideBatchSizeRangeRule(64, 86400),
      new FunnelOverrideChannelLengthRule(3600),
      new FunnelOverrideOpenRateRangeRule(1.9, 3094),
      new FunnelOverrideCodePrefixRule("ACM"),
      new FunnelOverrideAllowedExternalRefRule(["pending", "strict", "global"]),
    ],
  );
}
