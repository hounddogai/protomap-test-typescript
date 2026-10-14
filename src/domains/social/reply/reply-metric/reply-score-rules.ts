import { ReplyScore } from "./reply-score.js";

/** A rule a reply score must pass. Check returns its problems, or none. */
export interface ReplyScoreRule {
  check(item: ReplyScore): string[];
}

export class ReplyScoreLocaleLengthRule implements ReplyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyScore): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyScoreCodeLengthRule implements ReplyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyScoreRequiredCodeRule implements ReplyScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply score. */
export class ReplyScoreValidator {
  rules: ReplyScoreRule[];

  constructor(rules: ReplyScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyScore[]): Map<string, string[]> {
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

export function defaultReplyScoreValidator(): ReplyScoreValidator {
  return new ReplyScoreValidator(
    [
      new ReplyScoreLocaleLengthRule(255),
      new ReplyScoreCodeLengthRule(1000),
      new ReplyScoreRequiredCodeRule("reply score needs a value"),
    ],
  );
}
