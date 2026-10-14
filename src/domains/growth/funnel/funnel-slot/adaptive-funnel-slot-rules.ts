import * as text from "../../../../kit/text.js";
import { AdaptiveFunnelSlot } from "./adaptive-funnel-slot.js";

/** A rule a adaptive funnel slot must pass. Check returns its problems, or none. */
export interface AdaptiveFunnelSlotRule {
  check(item: AdaptiveFunnelSlot): string[];
}

export class AdaptiveFunnelSlotRequiredCodeRule implements AdaptiveFunnelSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFunnelSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFunnelSlotAllowedTitleRule implements AdaptiveFunnelSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveFunnelSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class AdaptiveFunnelSlotSequenceRangeRule implements AdaptiveFunnelSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFunnelSlot): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveFunnelSlotFloorValueRangeRule implements AdaptiveFunnelSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFunnelSlot): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveFunnelSlotCodePrefixRule implements AdaptiveFunnelSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveFunnelSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveFunnelSlotTitleLengthRule implements AdaptiveFunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFunnelSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive funnel slot. */
export class AdaptiveFunnelSlotValidator {
  rules: AdaptiveFunnelSlotRule[];

  constructor(rules: AdaptiveFunnelSlotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFunnelSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFunnelSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFunnelSlot[]): Map<string, string[]> {
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

export function defaultAdaptiveFunnelSlotValidator(): AdaptiveFunnelSlotValidator {
  return new AdaptiveFunnelSlotValidator(
    [
      new AdaptiveFunnelSlotRequiredCodeRule("adaptive funnel slot needs a value"),
      new AdaptiveFunnelSlotAllowedTitleRule(["pending", "adaptive"]),
      new AdaptiveFunnelSlotSequenceRangeRule(120, 3600),
      new AdaptiveFunnelSlotFloorValueRangeRule(6.3, 1375.7),
      new AdaptiveFunnelSlotCodePrefixRule("X"),
      new AdaptiveFunnelSlotTitleLengthRule(64),
    ],
  );
}
