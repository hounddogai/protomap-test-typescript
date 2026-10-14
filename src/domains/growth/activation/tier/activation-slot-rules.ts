import * as text from "../../../../kit/text.js";
import { ActivationSlot } from "./activation-slot.js";

/** A rule a activation slot must pass. Check returns its problems, or none. */
export interface ActivationSlotRule {
  check(item: ActivationSlot): string[];
}

export class ActivationSlotRequiredNameRule implements ActivationSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationSlotAllowedCodeRule implements ActivationSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class ActivationSlotVisibleGuardRule implements ActivationSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ActivationSlot): string[] {
    if (item.visible && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ActivationSlotMarginRangeRule implements ActivationSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationSlot): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a activation slot. */
export class ActivationSlotValidator {
  rules: ActivationSlotRule[];

  constructor(rules: ActivationSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationSlot[]): Map<string, string[]> {
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

export function defaultActivationSlotValidator(): ActivationSlotValidator {
  return new ActivationSlotValidator(
    [
      new ActivationSlotRequiredNameRule("activation slot needs an entry"),
      new ActivationSlotAllowedCodeRule(["fallback"]),
      new ActivationSlotVisibleGuardRule(86400),
      new ActivationSlotMarginRangeRule(2.1, 341.8),
    ],
  );
}
