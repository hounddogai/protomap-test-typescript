import { SuppressionProfile } from "./suppression-profile.js";

/** A rule a suppression profile must pass. Check returns its problems, or none. */
export interface SuppressionProfileRule {
  check(item: SuppressionProfile): string[];
}

export class SuppressionProfileRequiredChannelRule implements SuppressionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionProfile): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionProfileRegionLengthRule implements SuppressionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionProfile): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionProfileRequiredRegionRule implements SuppressionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionProfile): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionProfileCodePrefixRule implements SuppressionProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a suppression profile. */
export class SuppressionProfileValidator {
  rules: SuppressionProfileRule[];

  constructor(rules: SuppressionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionProfile): string[] {
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

  requireValid(item: SuppressionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionProfile[]): Map<string, string[]> {
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

export function defaultSuppressionProfileValidator(): SuppressionProfileValidator {
  return new SuppressionProfileValidator(
    [
      new SuppressionProfileRequiredChannelRule("suppression profile needs an entry"),
      new SuppressionProfileRegionLengthRule(120),
      new SuppressionProfileRequiredRegionRule("suppression profile needs this field"),
      new SuppressionProfileCodePrefixRule("OPS"),
    ],
  );
}
