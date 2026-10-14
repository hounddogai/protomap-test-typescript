import * as text from "../../../../kit/text.js";
import { ConversionSlot } from "./conversion-slot.js";

/** A rule a conversion slot must pass. Check returns its problems, or none. */
export interface ConversionSlotRule {
  check(item: ConversionSlot): string[];
}

export class ConversionSlotRequiredReviewerRule implements ConversionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionSlot): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionSlotSendAtRangeRule implements ConversionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionSlot): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionSlotReviewerLengthRule implements ConversionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionSlot): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionSlotTitleLengthRule implements ConversionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionSlotCodeLengthRule implements ConversionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionSlotAllowedRegionRule implements ConversionSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is unknown`];
    return [];
  }
}

/** Runs every rule of a conversion slot. */
export class ConversionSlotValidator {
  rules: ConversionSlotRule[];

  constructor(rules: ConversionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionSlot[]): Map<string, string[]> {
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

export function defaultConversionSlotValidator(): ConversionSlotValidator {
  return new ConversionSlotValidator(
    [
      new ConversionSlotRequiredReviewerRule("conversion slot needs this field"),
      new ConversionSlotSendAtRangeRule(16, 86400),
      new ConversionSlotReviewerLengthRule(120),
      new ConversionSlotTitleLengthRule(120),
      new ConversionSlotCodeLengthRule(64),
      new ConversionSlotAllowedRegionRule([]),
    ],
  );
}
