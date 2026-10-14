import { LegacyBranchTarget } from "./legacy-branch-target.js";

/** A rule a legacy branch target must pass. Check returns its problems, or none. */
export interface LegacyBranchTargetRule {
  check(item: LegacyBranchTarget): string[];
}

export class LegacyBranchTargetRequiredCountryRule implements LegacyBranchTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBranchTarget): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBranchTargetTitleLengthRule implements LegacyBranchTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBranchTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBranchTargetCountryLengthRule implements LegacyBranchTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBranchTarget): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBranchTargetCurrencyLengthRule implements LegacyBranchTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBranchTarget): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBranchTargetRequiredCodeRule implements LegacyBranchTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBranchTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBranchTargetCodeLengthRule implements LegacyBranchTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBranchTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy branch target. */
export class LegacyBranchTargetValidator {
  rules: LegacyBranchTargetRule[];

  constructor(rules: LegacyBranchTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBranchTarget): string[] {
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

  requireValid(item: LegacyBranchTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBranchTarget[]): Map<string, string[]> {
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

export function defaultLegacyBranchTargetValidator(): LegacyBranchTargetValidator {
  return new LegacyBranchTargetValidator(
    [
      new LegacyBranchTargetRequiredCountryRule("legacy branch target needs a value"),
      new LegacyBranchTargetTitleLengthRule(120),
      new LegacyBranchTargetCountryLengthRule(3600),
      new LegacyBranchTargetCurrencyLengthRule(16),
      new LegacyBranchTargetRequiredCodeRule("legacy branch target needs an entry"),
      new LegacyBranchTargetCodeLengthRule(120),
    ],
  );
}
