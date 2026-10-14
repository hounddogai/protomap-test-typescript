import { ManualJourneySlot } from "./manual-journey-slot.js";

/** A rule a manual journey slot must pass. Check returns its problems, or none. */
export interface ManualJourneySlotRule {
  check(item: ManualJourneySlot): string[];
}

export class ManualJourneySlotLabelLengthRule implements ManualJourneySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualJourneySlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualJourneySlotRequiredExternalRefRule implements ManualJourneySlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualJourneySlot): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ManualJourneySlotChannelLengthRule implements ManualJourneySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualJourneySlot): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualJourneySlotCodeLengthRule implements ManualJourneySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualJourneySlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualJourneySlotRequiredChannelRule implements ManualJourneySlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualJourneySlot): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ManualJourneySlotRetriesRangeRule implements ManualJourneySlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualJourneySlot): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual journey slot. */
export class ManualJourneySlotValidator {
  rules: ManualJourneySlotRule[];

  constructor(rules: ManualJourneySlotRule[]) {
    this.rules = rules;
  }

  validate(item: ManualJourneySlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualJourneySlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualJourneySlot[]): Map<string, string[]> {
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

export function defaultManualJourneySlotValidator(): ManualJourneySlotValidator {
  return new ManualJourneySlotValidator(
    [
      new ManualJourneySlotLabelLengthRule(64),
      new ManualJourneySlotRequiredExternalRefRule("manual journey slot needs a value"),
      new ManualJourneySlotChannelLengthRule(80),
      new ManualJourneySlotCodeLengthRule(80),
      new ManualJourneySlotRequiredChannelRule("manual journey slot needs this field"),
      new ManualJourneySlotRetriesRangeRule(16, 32),
    ],
  );
}
