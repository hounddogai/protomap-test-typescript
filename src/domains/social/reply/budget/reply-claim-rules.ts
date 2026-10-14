import { ReplyClaim } from "./reply-claim.js";

/** A rule a reply claim must pass. Check returns its problems, or none. */
export interface ReplyClaimRule {
  check(item: ReplyClaim): string[];
}

export class ReplyClaimThresholdRangeRule implements ReplyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyClaim): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyClaimJourneyIdLengthRule implements ReplyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyClaim): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyClaimRequiredNameRule implements ReplyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyClaimChannelLengthRule implements ReplyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyClaim): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyClaimRequiredChannelRule implements ReplyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyClaim): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply claim. */
export class ReplyClaimValidator {
  rules: ReplyClaimRule[];

  constructor(rules: ReplyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyClaim[]): Map<string, string[]> {
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

export function defaultReplyClaimValidator(): ReplyClaimValidator {
  return new ReplyClaimValidator(
    [
      new ReplyClaimThresholdRangeRule(9.4, 3156.2),
      new ReplyClaimJourneyIdLengthRule(32),
      new ReplyClaimRequiredNameRule("reply claim needs this field"),
      new ReplyClaimChannelLengthRule(3600),
      new ReplyClaimRequiredChannelRule("reply claim needs this field"),
    ],
  );
}
