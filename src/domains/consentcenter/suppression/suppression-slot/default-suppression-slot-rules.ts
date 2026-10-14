import { DefaultSuppressionSlot } from "./default-suppression-slot.js";

/** A rule a default suppression slot must pass. Check returns its problems, or none. */
export interface DefaultSuppressionSlotRule {
  check(item: DefaultSuppressionSlot): string[];
}

export class DefaultSuppressionSlotChannelLengthRule implements DefaultSuppressionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSuppressionSlot): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSuppressionSlotQuantityRangeRule implements DefaultSuppressionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSuppressionSlot): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultSuppressionSlotCodeLengthRule implements DefaultSuppressionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSuppressionSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSuppressionSlotRequiredChannelRule implements DefaultSuppressionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultSuppressionSlot): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultSuppressionSlotExpiresAtRangeRule implements DefaultSuppressionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSuppressionSlot): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default suppression slot. */
export class DefaultSuppressionSlotValidator {
  rules: DefaultSuppressionSlotRule[];

  constructor(rules: DefaultSuppressionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSuppressionSlot): string[] {
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

  requireValid(item: DefaultSuppressionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSuppressionSlot[]): Map<string, string[]> {
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

export function defaultDefaultSuppressionSlotValidator(): DefaultSuppressionSlotValidator {
  return new DefaultSuppressionSlotValidator(
    [
      new DefaultSuppressionSlotChannelLengthRule(32),
      new DefaultSuppressionSlotQuantityRangeRule(80, 255),
      new DefaultSuppressionSlotCodeLengthRule(80),
      new DefaultSuppressionSlotRequiredChannelRule("default suppression slot needs a value"),
      new DefaultSuppressionSlotExpiresAtRangeRule(64, 86400),
    ],
  );
}
