import { MacroSlot } from "./macro-slot.js";

/** A rule a macro slot must pass. Check returns its problems, or none. */
export interface MacroSlotRule {
  check(item: MacroSlot): string[];
}

export class MacroSlotCohortLengthRule implements MacroSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroSlot): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroSlotRequiredCohortRule implements MacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSlot): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class MacroSlotRequiredLabelRule implements MacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class MacroSlotRequiredChannelRule implements MacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSlot): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class MacroSlotRequiredCodeRule implements MacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroSlotChannelLengthRule implements MacroSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroSlot): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a macro slot. */
export class MacroSlotValidator {
  rules: MacroSlotRule[];

  constructor(rules: MacroSlotRule[]) {
    this.rules = rules;
  }

  validate(item: MacroSlot): string[] {
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

  requireValid(item: MacroSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroSlot[]): Map<string, string[]> {
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

export function defaultMacroSlotValidator(): MacroSlotValidator {
  return new MacroSlotValidator(
    [
      new MacroSlotCohortLengthRule(86400),
      new MacroSlotRequiredCohortRule("macro slot needs this field"),
      new MacroSlotRequiredLabelRule("macro slot needs an entry"),
      new MacroSlotRequiredChannelRule("macro slot needs a value"),
      new MacroSlotRequiredCodeRule("macro slot needs this field"),
      new MacroSlotChannelLengthRule(64),
    ],
  );
}
