import { FunnelSlot } from "./funnel-slot.js";

/** A rule a funnel slot must pass. Check returns its problems, or none. */
export interface FunnelSlotRule {
  check(item: FunnelSlot): string[];
}

export class FunnelSlotCodeLengthRule implements FunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelSlotNameLengthRule implements FunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelSlotRequiredContactEmailRule implements FunnelSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelSlot): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelSlotRequiredNameRule implements FunnelSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelSlotTagsLimitRule implements FunnelSlotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FunnelSlot): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class FunnelSlotRateRangeRule implements FunnelSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelSlot): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a funnel slot. */
export class FunnelSlotValidator {
  rules: FunnelSlotRule[];

  constructor(rules: FunnelSlotRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelSlot): string[] {
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

  requireValid(item: FunnelSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelSlot[]): Map<string, string[]> {
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

export function defaultFunnelSlotValidator(): FunnelSlotValidator {
  return new FunnelSlotValidator(
    [
      new FunnelSlotCodeLengthRule(80),
      new FunnelSlotNameLengthRule(1000),
      new FunnelSlotRequiredContactEmailRule("funnel slot needs a value"),
      new FunnelSlotRequiredNameRule("funnel slot needs an entry"),
      new FunnelSlotTagsLimitRule(64, []),
      new FunnelSlotRateRangeRule(4, 1137.8),
    ],
  );
}
