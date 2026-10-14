import * as text from "../../../../kit/text.js";
import { FallbackActivationSlot } from "./fallback-activation-slot.js";

/** A rule a fallback activation slot must pass. Check returns its problems, or none. */
export interface FallbackActivationSlotRule {
  check(item: FallbackActivationSlot): string[];
}

export class FallbackActivationSlotCodePrefixRule implements FallbackActivationSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackActivationSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackActivationSlotRequiredLabelRule implements FallbackActivationSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackActivationSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackActivationSlotRequiredCodeRule implements FallbackActivationSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackActivationSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackActivationSlotRatioRangeRule implements FallbackActivationSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackActivationSlot): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackActivationSlotAllowedLabelRule implements FallbackActivationSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackActivationSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

/** Runs every rule of a fallback activation slot. */
export class FallbackActivationSlotValidator {
  rules: FallbackActivationSlotRule[];

  constructor(rules: FallbackActivationSlotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackActivationSlot): string[] {
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

  requireValid(item: FallbackActivationSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackActivationSlot[]): Map<string, string[]> {
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

export function defaultFallbackActivationSlotValidator(): FallbackActivationSlotValidator {
  return new FallbackActivationSlotValidator(
    [
      new FallbackActivationSlotCodePrefixRule("ACM"),
      new FallbackActivationSlotRequiredLabelRule("fallback activation slot needs a value"),
      new FallbackActivationSlotRequiredCodeRule("fallback activation slot needs a value"),
      new FallbackActivationSlotRatioRangeRule(7.3, 1071.3),
      new FallbackActivationSlotAllowedLabelRule(["weighted", "strict"]),
    ],
  );
}
