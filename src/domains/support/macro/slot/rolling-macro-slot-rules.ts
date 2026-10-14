import { RollingMacroSlot } from "./rolling-macro-slot.js";

/** A rule a rolling macro slot must pass. Check returns its problems, or none. */
export interface RollingMacroSlotRule {
  check(item: RollingMacroSlot): string[];
}

export class RollingMacroSlotRequiredLabelRule implements RollingMacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingMacroSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingMacroSlotMaximumRangeRule implements RollingMacroSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMacroSlot): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingMacroSlotChannelLengthRule implements RollingMacroSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingMacroSlot): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling macro slot. */
export class RollingMacroSlotValidator {
  rules: RollingMacroSlotRule[];

  constructor(rules: RollingMacroSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RollingMacroSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingMacroSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingMacroSlot[]): Map<string, string[]> {
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

export function defaultRollingMacroSlotValidator(): RollingMacroSlotValidator {
  return new RollingMacroSlotValidator(
    [
      new RollingMacroSlotRequiredLabelRule("rolling macro slot needs this field"),
      new RollingMacroSlotMaximumRangeRule(1.7, 1197.4),
      new RollingMacroSlotChannelLengthRule(120),
    ],
  );
}
