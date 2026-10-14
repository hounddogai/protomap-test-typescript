import { ModelEntry } from "./model-entry.js";

/** A rule a model entry must pass. Check returns its problems, or none. */
export interface ModelEntryRule {
  check(item: ModelEntry): string[];
}

export class ModelEntryRequiredCampaignRefRule implements ModelEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelEntry): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ModelEntryCampaignRefLengthRule implements ModelEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelEntry): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelEntryCodePrefixRule implements ModelEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelEntryCostRangeRule implements ModelEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelEntry): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a model entry. */
export class ModelEntryValidator {
  rules: ModelEntryRule[];

  constructor(rules: ModelEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ModelEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelEntry[]): Map<string, string[]> {
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

export function defaultModelEntryValidator(): ModelEntryValidator {
  return new ModelEntryValidator(
    [
      new ModelEntryRequiredCampaignRefRule("model entry needs an entry"),
      new ModelEntryCampaignRefLengthRule(1000),
      new ModelEntryCodePrefixRule("X"),
      new ModelEntryCostRangeRule(9.7, 202.4),
    ],
  );
}
