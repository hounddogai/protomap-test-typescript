import * as text from "../../../../kit/text.js";
import { FrequencyManifest } from "./frequency-manifest.js";

/** A rule a frequency manifest must pass. Check returns its problems, or none. */
export interface FrequencyManifestRule {
  check(item: FrequencyManifest): string[];
}

export class FrequencyManifestRequiredTitleRule implements FrequencyManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyManifestRequiredCodeRule implements FrequencyManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyManifestQuantityRangeRule implements FrequencyManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyManifest): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyManifestUtmSourceLengthRule implements FrequencyManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyManifest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyManifestAllowedUtmSourceRule implements FrequencyManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is below minimum`];
    return [];
  }
}

export class FrequencyManifestAudienceIdLengthRule implements FrequencyManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyManifest): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a frequency manifest. */
export class FrequencyManifestValidator {
  rules: FrequencyManifestRule[];

  constructor(rules: FrequencyManifestRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyManifest[]): Map<string, string[]> {
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

export function defaultFrequencyManifestValidator(): FrequencyManifestValidator {
  return new FrequencyManifestValidator(
    [
      new FrequencyManifestRequiredTitleRule("frequency manifest needs this field"),
      new FrequencyManifestRequiredCodeRule("frequency manifest needs this field"),
      new FrequencyManifestQuantityRangeRule(255, 255),
      new FrequencyManifestUtmSourceLengthRule(255),
      new FrequencyManifestAllowedUtmSourceRule(["adaptive", "scheduled", "global"]),
      new FrequencyManifestAudienceIdLengthRule(86400),
    ],
  );
}
