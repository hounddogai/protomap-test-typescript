import { WeightedReplyTarget } from "./weighted-reply-target.js";

/** A rule a weighted reply target must pass. Check returns its problems, or none. */
export interface WeightedReplyTargetRule {
  check(item: WeightedReplyTarget): string[];
}

export class WeightedReplyTargetRequiredCodeRule implements WeightedReplyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReplyTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReplyTargetRequiredTitleRule implements WeightedReplyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReplyTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReplyTargetTitleLengthRule implements WeightedReplyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReplyTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReplyTargetNameLengthRule implements WeightedReplyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReplyTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReplyTargetChecksumLengthRule implements WeightedReplyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReplyTarget): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted reply target. */
export class WeightedReplyTargetValidator {
  rules: WeightedReplyTargetRule[];

  constructor(rules: WeightedReplyTargetRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedReplyTarget): string[] {
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

  requireValid(item: WeightedReplyTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedReplyTarget[]): Map<string, string[]> {
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

export function defaultWeightedReplyTargetValidator(): WeightedReplyTargetValidator {
  return new WeightedReplyTargetValidator(
    [
      new WeightedReplyTargetRequiredCodeRule("weighted reply target needs this field"),
      new WeightedReplyTargetRequiredTitleRule("weighted reply target needs a value"),
      new WeightedReplyTargetTitleLengthRule(1000),
      new WeightedReplyTargetNameLengthRule(255),
      new WeightedReplyTargetChecksumLengthRule(80),
    ],
  );
}
