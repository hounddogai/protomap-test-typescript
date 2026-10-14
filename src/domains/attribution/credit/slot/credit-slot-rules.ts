import { CreditSlot } from "./credit-slot.js";

/** A rule a credit slot must pass. Check returns its problems, or none. */
export interface CreditSlotRule {
  check(item: CreditSlot): string[];
}

export class CreditSlotRequiredTitleRule implements CreditSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CreditSlotCodePrefixRule implements CreditSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditSlotOpenRateRangeRule implements CreditSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditSlot): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditSlotRequiredCodeRule implements CreditSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditSlotTagsLimitRule implements CreditSlotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CreditSlot): string[] {
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

export class CreditSlotCodeLengthRule implements CreditSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit slot. */
export class CreditSlotValidator {
  rules: CreditSlotRule[];

  constructor(rules: CreditSlotRule[]) {
    this.rules = rules;
  }

  validate(item: CreditSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditSlot[]): Map<string, string[]> {
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

export function defaultCreditSlotValidator(): CreditSlotValidator {
  return new CreditSlotValidator(
    [
      new CreditSlotRequiredTitleRule("credit slot needs an entry"),
      new CreditSlotCodePrefixRule("ACM"),
      new CreditSlotOpenRateRangeRule(7.1, 4167.7),
      new CreditSlotRequiredCodeRule("credit slot needs this field"),
      new CreditSlotTagsLimitRule(64, ["fallback", "primary"]),
      new CreditSlotCodeLengthRule(3600),
    ],
  );
}
