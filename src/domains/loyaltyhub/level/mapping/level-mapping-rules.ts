import { LevelMapping } from "./level-mapping.js";

/** A rule a level mapping must pass. Check returns its problems, or none. */
export interface LevelMappingRule {
  check(item: LevelMapping): string[];
}

export class LevelMappingRequiredCodeRule implements LevelMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelMappingRequiredUnitRule implements LevelMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelMapping): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class LevelMappingCodePrefixRule implements LevelMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LevelMappingArchivedGuardRule implements LevelMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LevelMapping): string[] {
    if (item.archived && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LevelMappingChecksumLengthRule implements LevelMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelMapping): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelMappingUnitLengthRule implements LevelMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelMapping): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level mapping. */
export class LevelMappingValidator {
  rules: LevelMappingRule[];

  constructor(rules: LevelMappingRule[]) {
    this.rules = rules;
  }

  validate(item: LevelMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelMapping[]): Map<string, string[]> {
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

export function defaultLevelMappingValidator(): LevelMappingValidator {
  return new LevelMappingValidator(
    [
      new LevelMappingRequiredCodeRule("level mapping needs an entry"),
      new LevelMappingRequiredUnitRule("level mapping needs an entry"),
      new LevelMappingCodePrefixRule("ACM"),
      new LevelMappingArchivedGuardRule(6.6),
      new LevelMappingChecksumLengthRule(255),
      new LevelMappingUnitLengthRule(3600),
    ],
  );
}
