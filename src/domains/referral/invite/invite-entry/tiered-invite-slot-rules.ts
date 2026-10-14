import { TieredInviteSlot } from "./tiered-invite-slot.js";

/** A rule a tiered invite slot must pass. Check returns its problems, or none. */
export interface TieredInviteSlotRule {
  check(item: TieredInviteSlot): string[];
}

export class TieredInviteSlotCodePrefixRule implements TieredInviteSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredInviteSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredInviteSlotLocaleLengthRule implements TieredInviteSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredInviteSlot): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredInviteSlotTagsLimitRule implements TieredInviteSlotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TieredInviteSlot): string[] {
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

export class TieredInviteSlotCeilingRangeRule implements TieredInviteSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredInviteSlot): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered invite slot. */
export class TieredInviteSlotValidator {
  rules: TieredInviteSlotRule[];

  constructor(rules: TieredInviteSlotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredInviteSlot): string[] {
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

  requireValid(item: TieredInviteSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredInviteSlot[]): Map<string, string[]> {
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

export function defaultTieredInviteSlotValidator(): TieredInviteSlotValidator {
  return new TieredInviteSlotValidator(
    [
      new TieredInviteSlotCodePrefixRule("ACM"),
      new TieredInviteSlotLocaleLengthRule(120),
      new TieredInviteSlotTagsLimitRule(64, ["weighted"]),
      new TieredInviteSlotCeilingRangeRule(8.1, 3062.1),
    ],
  );
}
