import * as text from "../../../../kit/text.js";
import { GlobalComplaintSlot } from "./global-complaint-slot.js";

/** A rule a global complaint slot must pass. Check returns its problems, or none. */
export interface GlobalComplaintSlotRule {
  check(item: GlobalComplaintSlot): string[];
}

export class GlobalComplaintSlotCodeLengthRule implements GlobalComplaintSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalComplaintSlotBudgetRangeRule implements GlobalComplaintSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalComplaintSlot): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalComplaintSlotCodePrefixRule implements GlobalComplaintSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalComplaintSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalComplaintSlotRequiredTimezoneRule implements GlobalComplaintSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalComplaintSlot): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalComplaintSlotAllowedCodeRule implements GlobalComplaintSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalComplaintSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

/** Runs every rule of a global complaint slot. */
export class GlobalComplaintSlotValidator {
  rules: GlobalComplaintSlotRule[];

  constructor(rules: GlobalComplaintSlotRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalComplaintSlot): string[] {
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

  requireValid(item: GlobalComplaintSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalComplaintSlot[]): Map<string, string[]> {
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

export function defaultGlobalComplaintSlotValidator(): GlobalComplaintSlotValidator {
  return new GlobalComplaintSlotValidator(
    [
      new GlobalComplaintSlotCodeLengthRule(1000),
      new GlobalComplaintSlotBudgetRangeRule(9.8, 3406.1),
      new GlobalComplaintSlotCodePrefixRule("OPS"),
      new GlobalComplaintSlotRequiredTimezoneRule("global complaint slot needs a value"),
      new GlobalComplaintSlotAllowedCodeRule(["primary"]),
    ],
  );
}
