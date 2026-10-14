import * as text from "../../../../kit/text.js";
import { LenientProofTarget } from "./lenient-proof-target.js";

/** A rule a lenient proof target must pass. Check returns its problems, or none. */
export interface LenientProofTargetRule {
  check(item: LenientProofTarget): string[];
}

export class LenientProofTargetAllowedSummaryRule implements LenientProofTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientProofTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is out of range`];
    return [];
  }
}

export class LenientProofTargetRequiredChannelRule implements LenientProofTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientProofTarget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class LenientProofTargetChannelLengthRule implements LenientProofTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientProofTarget): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientProofTargetVersionRangeRule implements LenientProofTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientProofTarget): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientProofTargetSummaryLengthRule implements LenientProofTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientProofTarget): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient proof target. */
export class LenientProofTargetValidator {
  rules: LenientProofTargetRule[];

  constructor(rules: LenientProofTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientProofTarget): string[] {
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

  requireValid(item: LenientProofTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientProofTarget[]): Map<string, string[]> {
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

export function defaultLenientProofTargetValidator(): LenientProofTargetValidator {
  return new LenientProofTargetValidator(
    [
      new LenientProofTargetAllowedSummaryRule(["pending"]),
      new LenientProofTargetRequiredChannelRule("lenient proof target needs an entry"),
      new LenientProofTargetChannelLengthRule(64),
      new LenientProofTargetVersionRangeRule(32, 120),
      new LenientProofTargetSummaryLengthRule(3600),
    ],
  );
}
