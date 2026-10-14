import { InviteProfile } from "./invite-profile.js";

/** A rule a invite profile must pass. Check returns its problems, or none. */
export interface InviteProfileRule {
  check(item: InviteProfile): string[];
}

export class InviteProfileTitleLengthRule implements InviteProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteProfile): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteProfileRateRangeRule implements InviteProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteProfile): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteProfileBatchSizeRangeRule implements InviteProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteProfile): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InviteProfileCodeLengthRule implements InviteProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteProfileRequiredChannelRule implements InviteProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteProfile): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class InviteProfileCodePrefixRule implements InviteProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a invite profile. */
export class InviteProfileValidator {
  rules: InviteProfileRule[];

  constructor(rules: InviteProfileRule[]) {
    this.rules = rules;
  }

  validate(item: InviteProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteProfile[]): Map<string, string[]> {
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

export function defaultInviteProfileValidator(): InviteProfileValidator {
  return new InviteProfileValidator(
    [
      new InviteProfileTitleLengthRule(16),
      new InviteProfileRateRangeRule(4.9, 3303.2),
      new InviteProfileBatchSizeRangeRule(64, 255),
      new InviteProfileCodeLengthRule(1000),
      new InviteProfileRequiredChannelRule("invite profile needs a value"),
      new InviteProfileCodePrefixRule("Q"),
    ],
  );
}
