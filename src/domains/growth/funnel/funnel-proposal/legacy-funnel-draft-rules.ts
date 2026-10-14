import { LegacyFunnelDraft } from "./legacy-funnel-draft.js";

/** A rule a legacy funnel draft must pass. Check returns its problems, or none. */
export interface LegacyFunnelDraftRule {
  check(item: LegacyFunnelDraft): string[];
}

export class LegacyFunnelDraftRequiredChannelRule implements LegacyFunnelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFunnelDraft): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFunnelDraftLabelLengthRule implements LegacyFunnelDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFunnelDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFunnelDraftRequiredCodeRule implements LegacyFunnelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFunnelDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFunnelDraftRequiredLabelRule implements LegacyFunnelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFunnelDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFunnelDraftLimitRangeRule implements LegacyFunnelDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFunnelDraft): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyFunnelDraftCodePrefixRule implements LegacyFunnelDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyFunnelDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy funnel draft. */
export class LegacyFunnelDraftValidator {
  rules: LegacyFunnelDraftRule[];

  constructor(rules: LegacyFunnelDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFunnelDraft): string[] {
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

  requireValid(item: LegacyFunnelDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFunnelDraft[]): Map<string, string[]> {
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

export function defaultLegacyFunnelDraftValidator(): LegacyFunnelDraftValidator {
  return new LegacyFunnelDraftValidator(
    [
      new LegacyFunnelDraftRequiredChannelRule("legacy funnel draft needs this field"),
      new LegacyFunnelDraftLabelLengthRule(255),
      new LegacyFunnelDraftRequiredCodeRule("legacy funnel draft needs a value"),
      new LegacyFunnelDraftRequiredLabelRule("legacy funnel draft needs a value"),
      new LegacyFunnelDraftLimitRangeRule(64, 120),
      new LegacyFunnelDraftCodePrefixRule("REF"),
    ],
  );
}
