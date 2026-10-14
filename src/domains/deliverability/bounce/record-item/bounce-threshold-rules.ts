import { BounceThreshold } from "./bounce-threshold.js";

/** A rule a bounce threshold must pass. Check returns its problems, or none. */
export interface BounceThresholdRule {
  check(item: BounceThreshold): string[];
}

export class BounceThresholdRequiredCodeRule implements BounceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceThresholdNameLengthRule implements BounceThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceThresholdRequiredNameRule implements BounceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BounceThresholdChannelLengthRule implements BounceThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceThreshold): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceThresholdRequiredChannelRule implements BounceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceThreshold): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BounceThresholdRequiredCategoryRule implements BounceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceThreshold): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bounce threshold. */
export class BounceThresholdValidator {
  rules: BounceThresholdRule[];

  constructor(rules: BounceThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: BounceThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceThreshold[]): Map<string, string[]> {
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

export function defaultBounceThresholdValidator(): BounceThresholdValidator {
  return new BounceThresholdValidator(
    [
      new BounceThresholdRequiredCodeRule("bounce threshold needs an entry"),
      new BounceThresholdNameLengthRule(86400),
      new BounceThresholdRequiredNameRule("bounce threshold needs a value"),
      new BounceThresholdChannelLengthRule(80),
      new BounceThresholdRequiredChannelRule("bounce threshold needs this field"),
      new BounceThresholdRequiredCategoryRule("bounce threshold needs this field"),
    ],
  );
}
