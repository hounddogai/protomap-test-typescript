import { InviteThreshold } from "./invite-threshold.js";

/** A rule a invite threshold must pass. Check returns its problems, or none. */
export interface InviteThresholdRule {
  check(item: InviteThreshold): string[];
}

export class InviteThresholdRequiredTitleRule implements InviteThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InviteThresholdCodePrefixRule implements InviteThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteThresholdRatioRangeRule implements InviteThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteThreshold): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteThresholdRequiredCodeRule implements InviteThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteThresholdTitleLengthRule implements InviteThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite threshold. */
export class InviteThresholdValidator {
  rules: InviteThresholdRule[];

  constructor(rules: InviteThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: InviteThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteThreshold[]): Map<string, string[]> {
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

export function defaultInviteThresholdValidator(): InviteThresholdValidator {
  return new InviteThresholdValidator(
    [
      new InviteThresholdRequiredTitleRule("invite threshold needs this field"),
      new InviteThresholdCodePrefixRule("OPS"),
      new InviteThresholdRatioRangeRule(7.4, 742.5),
      new InviteThresholdRequiredCodeRule("invite threshold needs this field"),
      new InviteThresholdTitleLengthRule(86400),
    ],
  );
}
