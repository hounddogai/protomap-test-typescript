import { SenderCycle } from "./sender-cycle.js";

/** A rule a sender cycle must pass. Check returns its problems, or none. */
export interface SenderCycleRule {
  check(item: SenderCycle): string[];
}

export class SenderCycleRequiredCodeRule implements SenderCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderCycleReviewerLengthRule implements SenderCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderCycle): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderCycleDescriptionLengthRule implements SenderCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderCycle): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderCycleCodeLengthRule implements SenderCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderCycleTagsLimitRule implements SenderCycleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: SenderCycle): string[] {
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

/** Runs every rule of a sender cycle. */
export class SenderCycleValidator {
  rules: SenderCycleRule[];

  constructor(rules: SenderCycleRule[]) {
    this.rules = rules;
  }

  validate(item: SenderCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderCycle[]): Map<string, string[]> {
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

export function defaultSenderCycleValidator(): SenderCycleValidator {
  return new SenderCycleValidator(
    [
      new SenderCycleRequiredCodeRule("sender cycle needs a value"),
      new SenderCycleReviewerLengthRule(3600),
      new SenderCycleDescriptionLengthRule(32),
      new SenderCycleCodeLengthRule(3600),
      new SenderCycleTagsLimitRule(64, []),
    ],
  );
}
