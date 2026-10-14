import { DefaultChallengeSlot } from "./default-challenge-slot.js";

/** A rule a default challenge slot must pass. Check returns its problems, or none. */
export interface DefaultChallengeSlotRule {
  check(item: DefaultChallengeSlot): string[];
}

export class DefaultChallengeSlotRequiredLabelRule implements DefaultChallengeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultChallengeSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultChallengeSlotCodeLengthRule implements DefaultChallengeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultChallengeSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultChallengeSlotRequiredChannelRule implements DefaultChallengeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultChallengeSlot): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultChallengeSlotPriorityRangeRule implements DefaultChallengeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultChallengeSlot): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultChallengeSlotTagsLimitRule implements DefaultChallengeSlotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: DefaultChallengeSlot): string[] {
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

export class DefaultChallengeSlotVersionRangeRule implements DefaultChallengeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultChallengeSlot): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default challenge slot. */
export class DefaultChallengeSlotValidator {
  rules: DefaultChallengeSlotRule[];

  constructor(rules: DefaultChallengeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultChallengeSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultChallengeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultChallengeSlot[]): Map<string, string[]> {
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

export function defaultDefaultChallengeSlotValidator(): DefaultChallengeSlotValidator {
  return new DefaultChallengeSlotValidator(
    [
      new DefaultChallengeSlotRequiredLabelRule("default challenge slot needs an entry"),
      new DefaultChallengeSlotCodeLengthRule(64),
      new DefaultChallengeSlotRequiredChannelRule("default challenge slot needs a value"),
      new DefaultChallengeSlotPriorityRangeRule(120, 255),
      new DefaultChallengeSlotTagsLimitRule(255, ["capped"]),
      new DefaultChallengeSlotVersionRangeRule(64, 255),
    ],
  );
}
