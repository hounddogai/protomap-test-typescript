import { PrimaryMacroPolicy } from "./primary-macro-policy.js";

/** A rule a primary macro policy must pass. Check returns its problems, or none. */
export interface PrimaryMacroPolicyRule {
  check(item: PrimaryMacroPolicy): string[];
}

export class PrimaryMacroPolicyPinnedGuardRule implements PrimaryMacroPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryMacroPolicy): string[] {
    if (item.pinned && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PrimaryMacroPolicyUtmSourceLengthRule implements PrimaryMacroPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMacroPolicy): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryMacroPolicyCodeLengthRule implements PrimaryMacroPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMacroPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryMacroPolicyRequiredTitleRule implements PrimaryMacroPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryMacroPolicyRequiredCodeRule implements PrimaryMacroPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryMacroPolicyRequiredUtmSourceRule implements PrimaryMacroPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroPolicy): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary macro policy. */
export class PrimaryMacroPolicyValidator {
  rules: PrimaryMacroPolicyRule[];

  constructor(rules: PrimaryMacroPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryMacroPolicy): string[] {
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

  requireValid(item: PrimaryMacroPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryMacroPolicy[]): Map<string, string[]> {
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

export function defaultPrimaryMacroPolicyValidator(): PrimaryMacroPolicyValidator {
  return new PrimaryMacroPolicyValidator(
    [
      new PrimaryMacroPolicyPinnedGuardRule(5.2),
      new PrimaryMacroPolicyUtmSourceLengthRule(32),
      new PrimaryMacroPolicyCodeLengthRule(16),
      new PrimaryMacroPolicyRequiredTitleRule("primary macro policy needs this field"),
      new PrimaryMacroPolicyRequiredCodeRule("primary macro policy needs an entry"),
      new PrimaryMacroPolicyRequiredUtmSourceRule("primary macro policy needs an entry"),
    ],
  );
}
