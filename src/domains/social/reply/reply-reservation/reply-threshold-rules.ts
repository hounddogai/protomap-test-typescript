import { ReplyThreshold } from "./reply-threshold.js";

/** A rule a reply threshold must pass. Check returns its problems, or none. */
export interface ReplyThresholdRule {
  check(item: ReplyThreshold): string[];
}

export class ReplyThresholdCodePrefixRule implements ReplyThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyThresholdRequiredNameRule implements ReplyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyThresholdOpenRateRangeRule implements ReplyThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyThreshold): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyThresholdNameLengthRule implements ReplyThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply threshold. */
export class ReplyThresholdValidator {
  rules: ReplyThresholdRule[];

  constructor(rules: ReplyThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyThreshold[]): Map<string, string[]> {
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

export function defaultReplyThresholdValidator(): ReplyThresholdValidator {
  return new ReplyThresholdValidator(
    [
      new ReplyThresholdCodePrefixRule("REF"),
      new ReplyThresholdRequiredNameRule("reply threshold needs this field"),
      new ReplyThresholdOpenRateRangeRule(0.6, 1327.7),
      new ReplyThresholdNameLengthRule(64),
    ],
  );
}
