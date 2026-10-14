import { LenientReplyClaim } from "./lenient-reply-claim.js";

/** A rule a lenient reply claim must pass. Check returns its problems, or none. */
export interface LenientReplyClaimRule {
  check(item: LenientReplyClaim): string[];
}

export class LenientReplyClaimRequiredPhoneRule implements LenientReplyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientReplyClaim): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientReplyClaimCreatedAtRangeRule implements LenientReplyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientReplyClaim): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientReplyClaimCodePrefixRule implements LenientReplyClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientReplyClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientReplyClaimRequiredUtmSourceRule implements LenientReplyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientReplyClaim): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class LenientReplyClaimLabelLengthRule implements LenientReplyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientReplyClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient reply claim. */
export class LenientReplyClaimValidator {
  rules: LenientReplyClaimRule[];

  constructor(rules: LenientReplyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LenientReplyClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientReplyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientReplyClaim[]): Map<string, string[]> {
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

export function defaultLenientReplyClaimValidator(): LenientReplyClaimValidator {
  return new LenientReplyClaimValidator(
    [
      new LenientReplyClaimRequiredPhoneRule("lenient reply claim needs this field"),
      new LenientReplyClaimCreatedAtRangeRule(64, 255),
      new LenientReplyClaimCodePrefixRule("OPS"),
      new LenientReplyClaimRequiredUtmSourceRule("lenient reply claim needs an entry"),
      new LenientReplyClaimLabelLengthRule(32),
    ],
  );
}
