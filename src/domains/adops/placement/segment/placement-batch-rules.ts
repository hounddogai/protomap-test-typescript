import { PlacementBatch } from "./placement-batch.js";

/** A rule a placement batch must pass. Check returns its problems, or none. */
export interface PlacementBatchRule {
  check(item: PlacementBatch): string[];
}

export class PlacementBatchRequiredCodeRule implements PlacementBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementBatchCodeLengthRule implements PlacementBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementBatchLabelLengthRule implements PlacementBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementBatchTagsLimitRule implements PlacementBatchRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PlacementBatch): string[] {
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

export class PlacementBatchQuantityRangeRule implements PlacementBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementBatch): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a placement batch. */
export class PlacementBatchValidator {
  rules: PlacementBatchRule[];

  constructor(rules: PlacementBatchRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementBatch): string[] {
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

  requireValid(item: PlacementBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementBatch[]): Map<string, string[]> {
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

export function defaultPlacementBatchValidator(): PlacementBatchValidator {
  return new PlacementBatchValidator(
    [
      new PlacementBatchRequiredCodeRule("placement batch needs this field"),
      new PlacementBatchCodeLengthRule(80),
      new PlacementBatchLabelLengthRule(86400),
      new PlacementBatchTagsLimitRule(255, ["pending", "lenient"]),
      new PlacementBatchQuantityRangeRule(16, 120),
    ],
  );
}
