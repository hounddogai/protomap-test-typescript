import * as text from "../../../../kit/text.js";
import { ConversionSnapshot } from "./conversion-snapshot.js";

/** A rule a conversion snapshot must pass. Check returns its problems, or none. */
export interface ConversionSnapshotRule {
  check(item: ConversionSnapshot): string[];
}

export class ConversionSnapshotRequiredCodeRule implements ConversionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionSnapshotCodePrefixRule implements ConversionSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionSnapshotAllowedNameRule implements ConversionSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class ConversionSnapshotWeightRangeRule implements ConversionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionSnapshot): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ConversionSnapshotRequiredNotesRule implements ConversionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionSnapshot): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionSnapshotRequiredChannelRule implements ConversionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionSnapshot): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion snapshot. */
export class ConversionSnapshotValidator {
  rules: ConversionSnapshotRule[];

  constructor(rules: ConversionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionSnapshot[]): Map<string, string[]> {
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

export function defaultConversionSnapshotValidator(): ConversionSnapshotValidator {
  return new ConversionSnapshotValidator(
    [
      new ConversionSnapshotRequiredCodeRule("conversion snapshot needs an entry"),
      new ConversionSnapshotCodePrefixRule("X"),
      new ConversionSnapshotAllowedNameRule(["legacy", "global", "default"]),
      new ConversionSnapshotWeightRangeRule(3.3, 2265.8),
      new ConversionSnapshotRequiredNotesRule("conversion snapshot needs a value"),
      new ConversionSnapshotRequiredChannelRule("conversion snapshot needs an entry"),
    ],
  );
}
