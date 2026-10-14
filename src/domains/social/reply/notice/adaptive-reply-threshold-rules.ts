import { AdaptiveReplyThreshold } from "./adaptive-reply-threshold.js";

/** A rule a adaptive reply threshold must pass. Check returns its problems, or none. */
export interface AdaptiveReplyThresholdRule {
  check(item: AdaptiveReplyThreshold): string[];
}

export class AdaptiveReplyThresholdCurrencyLengthRule implements AdaptiveReplyThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveReplyThreshold): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveReplyThresholdCodeLengthRule implements AdaptiveReplyThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveReplyThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveReplyThresholdLabelLengthRule implements AdaptiveReplyThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveReplyThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveReplyThresholdRequiredTitleRule implements AdaptiveReplyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveReplyThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive reply threshold. */
export class AdaptiveReplyThresholdValidator {
  rules: AdaptiveReplyThresholdRule[];

  constructor(rules: AdaptiveReplyThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveReplyThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveReplyThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveReplyThreshold[]): Map<string, string[]> {
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

export function defaultAdaptiveReplyThresholdValidator(): AdaptiveReplyThresholdValidator {
  return new AdaptiveReplyThresholdValidator(
    [
      new AdaptiveReplyThresholdCurrencyLengthRule(86400),
      new AdaptiveReplyThresholdCodeLengthRule(255),
      new AdaptiveReplyThresholdLabelLengthRule(64),
      new AdaptiveReplyThresholdRequiredTitleRule("adaptive reply threshold needs this field"),
    ],
  );
}
