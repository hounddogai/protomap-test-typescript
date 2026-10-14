import { BounceOverride } from "./bounce-override.js";

/** A rule a bounce override must pass. Check returns its problems, or none. */
export interface BounceOverrideRule {
  check(item: BounceOverride): string[];
}

export class BounceOverrideRequiredChannelRule implements BounceOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceOverride): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BounceOverrideCodeLengthRule implements BounceOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceOverrideChannelLengthRule implements BounceOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceOverride): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceOverrideRequiredNameRule implements BounceOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bounce override. */
export class BounceOverrideValidator {
  rules: BounceOverrideRule[];

  constructor(rules: BounceOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: BounceOverride): string[] {
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

  requireValid(item: BounceOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceOverride[]): Map<string, string[]> {
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

export function defaultBounceOverrideValidator(): BounceOverrideValidator {
  return new BounceOverrideValidator(
    [
      new BounceOverrideRequiredChannelRule("bounce override needs an entry"),
      new BounceOverrideCodeLengthRule(120),
      new BounceOverrideChannelLengthRule(1000),
      new BounceOverrideRequiredNameRule("bounce override needs a value"),
    ],
  );
}
