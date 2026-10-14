import * as text from "../../../../kit/text.js";
import { FrequencyBundle } from "./frequency-bundle.js";

/** A rule a frequency bundle must pass. Check returns its problems, or none. */
export interface FrequencyBundleRule {
  check(item: FrequencyBundle): string[];
}

export class FrequencyBundleUtmSourceLengthRule implements FrequencyBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyBundle): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyBundleCodePrefixRule implements FrequencyBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyBundleCodeLengthRule implements FrequencyBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyBundleNameLengthRule implements FrequencyBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyBundleAllowedUnitRule implements FrequencyBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is out of range`];
    return [];
  }
}

/** Runs every rule of a frequency bundle. */
export class FrequencyBundleValidator {
  rules: FrequencyBundleRule[];

  constructor(rules: FrequencyBundleRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyBundle): string[] {
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

  requireValid(item: FrequencyBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyBundle[]): Map<string, string[]> {
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

export function defaultFrequencyBundleValidator(): FrequencyBundleValidator {
  return new FrequencyBundleValidator(
    [
      new FrequencyBundleUtmSourceLengthRule(3600),
      new FrequencyBundleCodePrefixRule("REF"),
      new FrequencyBundleCodeLengthRule(16),
      new FrequencyBundleNameLengthRule(3600),
      new FrequencyBundleAllowedUnitRule([]),
    ],
  );
}
