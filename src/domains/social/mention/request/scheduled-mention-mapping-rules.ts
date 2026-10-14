import { ScheduledMentionMapping } from "./scheduled-mention-mapping.js";

/** A rule a scheduled mention mapping must pass. Check returns its problems, or none. */
export interface ScheduledMentionMappingRule {
  check(item: ScheduledMentionMapping): string[];
}

export class ScheduledMentionMappingCodeLengthRule implements ScheduledMentionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMentionMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledMentionMappingTagsLimitRule implements ScheduledMentionMappingRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ScheduledMentionMapping): string[] {
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

export class ScheduledMentionMappingRequiredCodeRule implements ScheduledMentionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMentionMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMentionMappingLabelLengthRule implements ScheduledMentionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMentionMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledMentionMappingSourceLengthRule implements ScheduledMentionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMentionMapping): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled mention mapping. */
export class ScheduledMentionMappingValidator {
  rules: ScheduledMentionMappingRule[];

  constructor(rules: ScheduledMentionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledMentionMapping): string[] {
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

  requireValid(item: ScheduledMentionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledMentionMapping[]): Map<string, string[]> {
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

export function defaultScheduledMentionMappingValidator(): ScheduledMentionMappingValidator {
  return new ScheduledMentionMappingValidator(
    [
      new ScheduledMentionMappingCodeLengthRule(255),
      new ScheduledMentionMappingTagsLimitRule(3600, ["global", "capped"]),
      new ScheduledMentionMappingRequiredCodeRule("scheduled mention mapping needs this field"),
      new ScheduledMentionMappingLabelLengthRule(80),
      new ScheduledMentionMappingSourceLengthRule(255),
    ],
  );
}
