import { SenderEntry } from "./sender-entry.js";

/** A rule a sender entry must pass. Check returns its problems, or none. */
export interface SenderEntryRule {
  check(item: SenderEntry): string[];
}

export class SenderEntryOwnerIdLengthRule implements SenderEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderEntry): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderEntryRequiredChannelRule implements SenderEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderEntry): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SenderEntryTagsLimitRule implements SenderEntryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: SenderEntry): string[] {
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

export class SenderEntryRequiredLabelRule implements SenderEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender entry. */
export class SenderEntryValidator {
  rules: SenderEntryRule[];

  constructor(rules: SenderEntryRule[]) {
    this.rules = rules;
  }

  validate(item: SenderEntry): string[] {
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

  requireValid(item: SenderEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderEntry[]): Map<string, string[]> {
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

export function defaultSenderEntryValidator(): SenderEntryValidator {
  return new SenderEntryValidator(
    [
      new SenderEntryOwnerIdLengthRule(1000),
      new SenderEntryRequiredChannelRule("sender entry needs an entry"),
      new SenderEntryTagsLimitRule(64, []),
      new SenderEntryRequiredLabelRule("sender entry needs an entry"),
    ],
  );
}
