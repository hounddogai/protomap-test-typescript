import { WarmupProfile } from "./warmup-profile.js";

/** A rule a warmup profile must pass. Check returns its problems, or none. */
export interface WarmupProfileRule {
  check(item: WarmupProfile): string[];
}

export class WarmupProfileRequiredNameRule implements WarmupProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupProfileRateRangeRule implements WarmupProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupProfile): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupProfileRequiredPhoneRule implements WarmupProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupProfile): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupProfileCodeLengthRule implements WarmupProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup profile. */
export class WarmupProfileValidator {
  rules: WarmupProfileRule[];

  constructor(rules: WarmupProfileRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupProfile): string[] {
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

  requireValid(item: WarmupProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupProfile[]): Map<string, string[]> {
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

export function defaultWarmupProfileValidator(): WarmupProfileValidator {
  return new WarmupProfileValidator(
    [
      new WarmupProfileRequiredNameRule("warmup profile needs this field"),
      new WarmupProfileRateRangeRule(8.5, 2376.5),
      new WarmupProfileRequiredPhoneRule("warmup profile needs this field"),
      new WarmupProfileCodeLengthRule(80),
    ],
  );
}
