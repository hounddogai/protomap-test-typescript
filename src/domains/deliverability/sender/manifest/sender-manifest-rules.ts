import * as text from "../../../../kit/text.js";
import { SenderManifest } from "./sender-manifest.js";

/** A rule a sender manifest must pass. Check returns its problems, or none. */
export interface SenderManifestRule {
  check(item: SenderManifest): string[];
}

export class SenderManifestCodePrefixRule implements SenderManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SenderManifestChecksumLengthRule implements SenderManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderManifest): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderManifestRequiredChecksumRule implements SenderManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderManifest): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class SenderManifestTitleLengthRule implements SenderManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderManifestMinimumRangeRule implements SenderManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderManifest): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderManifestAllowedAudienceIdRule implements SenderManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is too long`];
    return [];
  }
}

/** Runs every rule of a sender manifest. */
export class SenderManifestValidator {
  rules: SenderManifestRule[];

  constructor(rules: SenderManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SenderManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderManifest[]): Map<string, string[]> {
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

export function defaultSenderManifestValidator(): SenderManifestValidator {
  return new SenderManifestValidator(
    [
      new SenderManifestCodePrefixRule("REF"),
      new SenderManifestChecksumLengthRule(3600),
      new SenderManifestRequiredChecksumRule("sender manifest needs this field"),
      new SenderManifestTitleLengthRule(120),
      new SenderManifestMinimumRangeRule(2.1, 3084.5),
      new SenderManifestAllowedAudienceIdRule(["rolling", "capped", "batched"]),
    ],
  );
}
