import { ReplyMetric } from "./reply-metric.js";

/** A rule a reply metric must pass. Check returns its problems, or none. */
export interface ReplyMetricRule {
  check(item: ReplyMetric): string[];
}

export class ReplyMetricCodeLengthRule implements ReplyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyMetricAudienceIdLengthRule implements ReplyMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyMetric): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyMetricRequiredCodeRule implements ReplyMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyMetricRequiredPhoneRule implements ReplyMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyMetric): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply metric. */
export class ReplyMetricValidator {
  rules: ReplyMetricRule[];

  constructor(rules: ReplyMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyMetric): string[] {
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

  requireValid(item: ReplyMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyMetric[]): Map<string, string[]> {
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

export function defaultReplyMetricValidator(): ReplyMetricValidator {
  return new ReplyMetricValidator(
    [
      new ReplyMetricCodeLengthRule(64),
      new ReplyMetricAudienceIdLengthRule(80),
      new ReplyMetricRequiredCodeRule("reply metric needs this field"),
      new ReplyMetricRequiredPhoneRule("reply metric needs this field"),
    ],
  );
}
