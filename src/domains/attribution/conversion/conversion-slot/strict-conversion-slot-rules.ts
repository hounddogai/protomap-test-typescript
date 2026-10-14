import { StrictConversionSlot } from "./strict-conversion-slot.js";

/** A rule a strict conversion slot must pass. Check returns its problems, or none. */
export interface StrictConversionSlotRule {
  check(item: StrictConversionSlot): string[];
}

export class StrictConversionSlotCodePrefixRule implements StrictConversionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictConversionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictConversionSlotRequiredTitleRule implements StrictConversionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictConversionSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictConversionSlotTitleLengthRule implements StrictConversionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictConversionSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictConversionSlotRequiredCampaignRefRule implements StrictConversionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictConversionSlot): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class StrictConversionSlotRequiredCodeRule implements StrictConversionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictConversionSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictConversionSlotCampaignRefLengthRule implements StrictConversionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictConversionSlot): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict conversion slot. */
export class StrictConversionSlotValidator {
  rules: StrictConversionSlotRule[];

  constructor(rules: StrictConversionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: StrictConversionSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictConversionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictConversionSlot[]): Map<string, string[]> {
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

export function defaultStrictConversionSlotValidator(): StrictConversionSlotValidator {
  return new StrictConversionSlotValidator(
    [
      new StrictConversionSlotCodePrefixRule("X"),
      new StrictConversionSlotRequiredTitleRule("strict conversion slot needs a value"),
      new StrictConversionSlotTitleLengthRule(3600),
      new StrictConversionSlotRequiredCampaignRefRule("strict conversion slot needs this field"),
      new StrictConversionSlotRequiredCodeRule("strict conversion slot needs this field"),
      new StrictConversionSlotCampaignRefLengthRule(32),
    ],
  );
}
