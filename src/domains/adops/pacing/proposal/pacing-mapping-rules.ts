import { PacingMapping } from "./pacing-mapping.js";

/** A rule a pacing mapping must pass. Check returns its problems, or none. */
export interface PacingMappingRule {
  check(item: PacingMapping): string[];
}

export class PacingMappingRequiredCodeRule implements PacingMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PacingMappingRequiredLabelRule implements PacingMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PacingMappingCodePrefixRule implements PacingMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingMappingActiveGuardRule implements PacingMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PacingMapping): string[] {
    if (item.active && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PacingMappingPriorityRangeRule implements PacingMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingMapping): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pacing mapping. */
export class PacingMappingValidator {
  rules: PacingMappingRule[];

  constructor(rules: PacingMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PacingMapping): string[] {
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

  requireValid(item: PacingMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingMapping[]): Map<string, string[]> {
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

export function defaultPacingMappingValidator(): PacingMappingValidator {
  return new PacingMappingValidator(
    [
      new PacingMappingRequiredCodeRule("pacing mapping needs this field"),
      new PacingMappingRequiredLabelRule("pacing mapping needs an entry"),
      new PacingMappingCodePrefixRule("X"),
      new PacingMappingActiveGuardRule(255),
      new PacingMappingPriorityRangeRule(32, 255),
    ],
  );
}
