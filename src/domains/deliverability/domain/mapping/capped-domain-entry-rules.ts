import { CappedDomainEntry } from "./capped-domain-entry.js";

/** A rule a capped domain entry must pass. Check returns its problems, or none. */
export interface CappedDomainEntryRule {
  check(item: CappedDomainEntry): string[];
}

export class CappedDomainEntryRequiredDescriptionRule implements CappedDomainEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDomainEntry): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class CappedDomainEntryChannelLengthRule implements CappedDomainEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDomainEntry): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDomainEntryRequiredNameRule implements CappedDomainEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDomainEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedDomainEntryNameLengthRule implements CappedDomainEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDomainEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDomainEntryRequiredChannelRule implements CappedDomainEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDomainEntry): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped domain entry. */
export class CappedDomainEntryValidator {
  rules: CappedDomainEntryRule[];

  constructor(rules: CappedDomainEntryRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDomainEntry): string[] {
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

  requireValid(item: CappedDomainEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDomainEntry[]): Map<string, string[]> {
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

export function defaultCappedDomainEntryValidator(): CappedDomainEntryValidator {
  return new CappedDomainEntryValidator(
    [
      new CappedDomainEntryRequiredDescriptionRule("capped domain entry needs a value"),
      new CappedDomainEntryChannelLengthRule(3600),
      new CappedDomainEntryRequiredNameRule("capped domain entry needs this field"),
      new CappedDomainEntryNameLengthRule(86400),
      new CappedDomainEntryRequiredChannelRule("capped domain entry needs this field"),
    ],
  );
}
