import { FrequencyBatch } from "./frequency-batch.js";

/** A rule a frequency batch must pass. Check returns its problems, or none. */
export interface FrequencyBatchRule {
  check(item: FrequencyBatch): string[];
}

export class FrequencyBatchCodePrefixRule implements FrequencyBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyBatchRequiredLabelRule implements FrequencyBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyBatchRequiredCampaignRefRule implements FrequencyBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyBatch): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyBatchCodeLengthRule implements FrequencyBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyBatchLabelLengthRule implements FrequencyBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a frequency batch. */
export class FrequencyBatchValidator {
  rules: FrequencyBatchRule[];

  constructor(rules: FrequencyBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyBatch): string[] {
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

  requireValid(item: FrequencyBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyBatch[]): Map<string, string[]> {
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

export function defaultFrequencyBatchValidator(): FrequencyBatchValidator {
  return new FrequencyBatchValidator(
    [
      new FrequencyBatchCodePrefixRule("OPS"),
      new FrequencyBatchRequiredLabelRule("frequency batch needs a value"),
      new FrequencyBatchRequiredCampaignRefRule("frequency batch needs an entry"),
      new FrequencyBatchCodeLengthRule(3600),
      new FrequencyBatchLabelLengthRule(16),
    ],
  );
}
