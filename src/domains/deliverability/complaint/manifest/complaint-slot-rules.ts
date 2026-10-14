import * as text from "../../../../kit/text.js";
import { ComplaintSlot } from "./complaint-slot.js";

/** A rule a complaint slot must pass. Check returns its problems, or none. */
export interface ComplaintSlotRule {
  check(item: ComplaintSlot): string[];
}

export class ComplaintSlotAllowedChannelRule implements ComplaintSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ComplaintSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is expired`];
    return [];
  }
}

export class ComplaintSlotCodeLengthRule implements ComplaintSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintSlotRequiredLocaleRule implements ComplaintSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintSlot): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintSlotRequiredCodeRule implements ComplaintSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintSlotRequiredTitleRule implements ComplaintSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint slot. */
export class ComplaintSlotValidator {
  rules: ComplaintSlotRule[];

  constructor(rules: ComplaintSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintSlot): string[] {
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

  requireValid(item: ComplaintSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintSlot[]): Map<string, string[]> {
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

export function defaultComplaintSlotValidator(): ComplaintSlotValidator {
  return new ComplaintSlotValidator(
    [
      new ComplaintSlotAllowedChannelRule(["legacy", "batched"]),
      new ComplaintSlotCodeLengthRule(255),
      new ComplaintSlotRequiredLocaleRule("complaint slot needs an entry"),
      new ComplaintSlotRequiredCodeRule("complaint slot needs a value"),
      new ComplaintSlotRequiredTitleRule("complaint slot needs an entry"),
    ],
  );
}
