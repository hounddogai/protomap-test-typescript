import * as text from "../../../../kit/text.js";
import { MentionVariance } from "./mention-variance.js";

/** A rule a mention variance must pass. Check returns its problems, or none. */
export interface MentionVarianceRule {
  check(item: MentionVariance): string[];
}

export class MentionVarianceRequiredLabelRule implements MentionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class MentionVarianceVariantLengthRule implements MentionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionVariance): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionVarianceRequiredVariantRule implements MentionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionVariance): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class MentionVarianceLabelLengthRule implements MentionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionVarianceChannelLengthRule implements MentionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionVariance): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionVarianceAllowedVariantRule implements MentionVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a mention variance. */
export class MentionVarianceValidator {
  rules: MentionVarianceRule[];

  constructor(rules: MentionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: MentionVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionVariance[]): Map<string, string[]> {
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

export function defaultMentionVarianceValidator(): MentionVarianceValidator {
  return new MentionVarianceValidator(
    [
      new MentionVarianceRequiredLabelRule("mention variance needs a value"),
      new MentionVarianceVariantLengthRule(3600),
      new MentionVarianceRequiredVariantRule("mention variance needs an entry"),
      new MentionVarianceLabelLengthRule(86400),
      new MentionVarianceChannelLengthRule(86400),
      new MentionVarianceAllowedVariantRule(["default"]),
    ],
  );
}
