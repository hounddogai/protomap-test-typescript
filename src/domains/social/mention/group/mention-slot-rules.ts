import { MentionSlot } from "./mention-slot.js";

/** A rule a mention slot must pass. Check returns its problems, or none. */
export interface MentionSlotRule {
  check(item: MentionSlot): string[];
}

export class MentionSlotCodePrefixRule implements MentionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionSlotRequiredCountryRule implements MentionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionSlot): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class MentionSlotTagsLimitRule implements MentionSlotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: MentionSlot): string[] {
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

/** Runs every rule of a mention slot. */
export class MentionSlotValidator {
  rules: MentionSlotRule[];

  constructor(rules: MentionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: MentionSlot): string[] {
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

  requireValid(item: MentionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionSlot[]): Map<string, string[]> {
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

export function defaultMentionSlotValidator(): MentionSlotValidator {
  return new MentionSlotValidator(
    [
      new MentionSlotCodePrefixRule("ACM"),
      new MentionSlotRequiredCountryRule("mention slot needs a value"),
      new MentionSlotTagsLimitRule(16, []),
    ],
  );
}
