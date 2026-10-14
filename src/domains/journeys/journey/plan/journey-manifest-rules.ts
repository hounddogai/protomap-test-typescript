import * as text from "../../../../kit/text.js";
import { JourneyManifest } from "./journey-manifest.js";

/** A rule a journey manifest must pass. Check returns its problems, or none. */
export interface JourneyManifestRule {
  check(item: JourneyManifest): string[];
}

export class JourneyManifestFrequencyCapRangeRule implements JourneyManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyManifest): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyManifestCodeLengthRule implements JourneyManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyManifestCodePrefixRule implements JourneyManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class JourneyManifestRequiredChecksumRule implements JourneyManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyManifest): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyManifestAllowedExternalRefRule implements JourneyManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is not allowed`];
    return [];
  }
}

/** Runs every rule of a journey manifest. */
export class JourneyManifestValidator {
  rules: JourneyManifestRule[];

  constructor(rules: JourneyManifestRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyManifest): string[] {
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

  requireValid(item: JourneyManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyManifest[]): Map<string, string[]> {
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

export function defaultJourneyManifestValidator(): JourneyManifestValidator {
  return new JourneyManifestValidator(
    [
      new JourneyManifestFrequencyCapRangeRule(1000, 1000),
      new JourneyManifestCodeLengthRule(64),
      new JourneyManifestCodePrefixRule("REF"),
      new JourneyManifestRequiredChecksumRule("journey manifest needs this field"),
      new JourneyManifestAllowedExternalRefRule(["rolling"]),
    ],
  );
}
