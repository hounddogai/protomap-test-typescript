import { ConversionLedger } from "./conversion-ledger.js";

/** A rule a conversion ledger must pass. Check returns its problems, or none. */
export interface ConversionLedgerRule {
  check(item: ConversionLedger): string[];
}

export class ConversionLedgerRequiredChecksumRule implements ConversionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionLedger): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionLedgerRequiredNameRule implements ConversionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionLedgerTagsLimitRule implements ConversionLedgerRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ConversionLedger): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ConversionLedgerCodePrefixRule implements ConversionLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionLedgerWeightRangeRule implements ConversionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionLedger): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ConversionLedgerChecksumLengthRule implements ConversionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionLedger): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion ledger. */
export class ConversionLedgerValidator {
  rules: ConversionLedgerRule[];

  constructor(rules: ConversionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionLedger[]): Map<string, string[]> {
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

export function defaultConversionLedgerValidator(): ConversionLedgerValidator {
  return new ConversionLedgerValidator(
    [
      new ConversionLedgerRequiredChecksumRule("conversion ledger needs a value"),
      new ConversionLedgerRequiredNameRule("conversion ledger needs a value"),
      new ConversionLedgerTagsLimitRule(1000, ["strict", "global", "primary"]),
      new ConversionLedgerCodePrefixRule("Q"),
      new ConversionLedgerWeightRangeRule(4.2, 741.1),
      new ConversionLedgerChecksumLengthRule(16),
    ],
  );
}
