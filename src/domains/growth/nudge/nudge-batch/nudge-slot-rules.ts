import { NudgeSlot } from "./nudge-slot.js";

/** A rule a nudge slot must pass. Check returns its problems, or none. */
export interface NudgeSlotRule {
  check(item: NudgeSlot): string[];
}

export class NudgeSlotCodeLengthRule implements NudgeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeSlotCodePrefixRule implements NudgeSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeSlotRequiredCodeRule implements NudgeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge slot. */
export class NudgeSlotValidator {
  rules: NudgeSlotRule[];

  constructor(rules: NudgeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeSlot[]): Map<string, string[]> {
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

export function defaultNudgeSlotValidator(): NudgeSlotValidator {
  return new NudgeSlotValidator(
    [
      new NudgeSlotCodeLengthRule(120),
      new NudgeSlotCodePrefixRule("X"),
      new NudgeSlotRequiredCodeRule("nudge slot needs this field"),
    ],
  );
}
