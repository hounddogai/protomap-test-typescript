import { CappedBounceRecord } from "./capped-bounce-record.js";

/** A rule a capped bounce record must pass. Check returns its problems, or none. */
export interface CappedBounceRecordRule {
  check(item: CappedBounceRecord): string[];
}

export class CappedBounceRecordCodePrefixRule implements CappedBounceRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedBounceRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedBounceRecordRequiredCodeRule implements CappedBounceRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBounceRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBounceRecordRequiredChannelRule implements CappedBounceRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBounceRecord): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBounceRecordTitleLengthRule implements CappedBounceRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBounceRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped bounce record. */
export class CappedBounceRecordValidator {
  rules: CappedBounceRecordRule[];

  constructor(rules: CappedBounceRecordRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBounceRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedBounceRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBounceRecord[]): Map<string, string[]> {
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

export function defaultCappedBounceRecordValidator(): CappedBounceRecordValidator {
  return new CappedBounceRecordValidator(
    [
      new CappedBounceRecordCodePrefixRule("OPS"),
      new CappedBounceRecordRequiredCodeRule("capped bounce record needs a value"),
      new CappedBounceRecordRequiredChannelRule("capped bounce record needs a value"),
      new CappedBounceRecordTitleLengthRule(64),
    ],
  );
}
