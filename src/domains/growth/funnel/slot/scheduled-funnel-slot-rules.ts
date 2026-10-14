import { ScheduledFunnelSlot } from "./scheduled-funnel-slot.js";

/** A rule a scheduled funnel slot must pass. Check returns its problems, or none. */
export interface ScheduledFunnelSlotRule {
  check(item: ScheduledFunnelSlot): string[];
}

export class ScheduledFunnelSlotRequiredDescriptionRule implements ScheduledFunnelSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFunnelSlot): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFunnelSlotCodePrefixRule implements ScheduledFunnelSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledFunnelSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledFunnelSlotLimitRangeRule implements ScheduledFunnelSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFunnelSlot): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledFunnelSlotMaximumRangeRule implements ScheduledFunnelSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFunnelSlot): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledFunnelSlotDescriptionLengthRule implements ScheduledFunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFunnelSlot): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled funnel slot. */
export class ScheduledFunnelSlotValidator {
  rules: ScheduledFunnelSlotRule[];

  constructor(rules: ScheduledFunnelSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFunnelSlot): string[] {
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

  requireValid(item: ScheduledFunnelSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFunnelSlot[]): Map<string, string[]> {
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

export function defaultScheduledFunnelSlotValidator(): ScheduledFunnelSlotValidator {
  return new ScheduledFunnelSlotValidator(
    [
      new ScheduledFunnelSlotRequiredDescriptionRule("scheduled funnel slot needs an entry"),
      new ScheduledFunnelSlotCodePrefixRule("OPS"),
      new ScheduledFunnelSlotLimitRangeRule(80, 1000),
      new ScheduledFunnelSlotMaximumRangeRule(7.9, 4645.6),
      new ScheduledFunnelSlotDescriptionLengthRule(120),
    ],
  );
}
