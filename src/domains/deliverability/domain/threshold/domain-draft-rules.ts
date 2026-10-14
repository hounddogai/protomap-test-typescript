import { DomainDraft } from "./domain-draft.js";

/** A rule a domain draft must pass. Check returns its problems, or none. */
export interface DomainDraftRule {
  check(item: DomainDraft): string[];
}

export class DomainDraftCapacityRangeRule implements DomainDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainDraft): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainDraftCreatedAtRangeRule implements DomainDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainDraft): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainDraftRequiredRegionRule implements DomainDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainDraft): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class DomainDraftPriorityRangeRule implements DomainDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainDraft): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainDraftRequiredLabelRule implements DomainDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DomainDraftRequiredCodeRule implements DomainDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain draft. */
export class DomainDraftValidator {
  rules: DomainDraftRule[];

  constructor(rules: DomainDraftRule[]) {
    this.rules = rules;
  }

  validate(item: DomainDraft): string[] {
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

  requireValid(item: DomainDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainDraft[]): Map<string, string[]> {
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

export function defaultDomainDraftValidator(): DomainDraftValidator {
  return new DomainDraftValidator(
    [
      new DomainDraftCapacityRangeRule(1000, 86400),
      new DomainDraftCreatedAtRangeRule(16, 255),
      new DomainDraftRequiredRegionRule("domain draft needs this field"),
      new DomainDraftPriorityRangeRule(80, 120),
      new DomainDraftRequiredLabelRule("domain draft needs a value"),
      new DomainDraftRequiredCodeRule("domain draft needs this field"),
    ],
  );
}
