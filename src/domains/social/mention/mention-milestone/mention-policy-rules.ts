import { MentionPolicy } from "./mention-policy.js";

/** A rule a mention policy must pass. Check returns its problems, or none. */
export interface MentionPolicyRule {
  check(item: MentionPolicy): string[];
}

export class MentionPolicyRequiredPhoneRule implements MentionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionPolicy): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class MentionPolicyCodePrefixRule implements MentionPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionPolicyTagsLimitRule implements MentionPolicyRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: MentionPolicy): string[] {
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

export class MentionPolicyChannelLengthRule implements MentionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionPolicy): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionPolicyRequiredChannelRule implements MentionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionPolicy): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a mention policy. */
export class MentionPolicyValidator {
  rules: MentionPolicyRule[];

  constructor(rules: MentionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: MentionPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionPolicy[]): Map<string, string[]> {
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

export function defaultMentionPolicyValidator(): MentionPolicyValidator {
  return new MentionPolicyValidator(
    [
      new MentionPolicyRequiredPhoneRule("mention policy needs this field"),
      new MentionPolicyCodePrefixRule("OPS"),
      new MentionPolicyTagsLimitRule(16, ["pending", "pending", "legacy"]),
      new MentionPolicyChannelLengthRule(120),
      new MentionPolicyRequiredChannelRule("mention policy needs a value"),
    ],
  );
}
