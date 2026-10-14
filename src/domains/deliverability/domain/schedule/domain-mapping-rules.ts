import * as text from "../../../../kit/text.js";
import { DomainMapping } from "./domain-mapping.js";

/** A rule a domain mapping must pass. Check returns its problems, or none. */
export interface DomainMappingRule {
  check(item: DomainMapping): string[];
}

export class DomainMappingCeilingRangeRule implements DomainMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainMapping): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainMappingRequiredCodeRule implements DomainMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainMappingAllowedOwnerIdRule implements DomainMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is stale`];
    return [];
  }
}

/** Runs every rule of a domain mapping. */
export class DomainMappingValidator {
  rules: DomainMappingRule[];

  constructor(rules: DomainMappingRule[]) {
    this.rules = rules;
  }

  validate(item: DomainMapping): string[] {
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

  requireValid(item: DomainMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainMapping[]): Map<string, string[]> {
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

export function defaultDomainMappingValidator(): DomainMappingValidator {
  return new DomainMappingValidator(
    [
      new DomainMappingCeilingRangeRule(1.2, 3517.3),
      new DomainMappingRequiredCodeRule("domain mapping needs an entry"),
      new DomainMappingAllowedOwnerIdRule([]),
    ],
  );
}
