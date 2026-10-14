import { StrictPlacementDraft } from "./strict-placement-draft.js";

/** A rule a strict placement draft must pass. Check returns its problems, or none. */
export interface StrictPlacementDraftRule {
  check(item: StrictPlacementDraft): string[];
}

export class StrictPlacementDraftRequiredSummaryRule implements StrictPlacementDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPlacementDraft): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPlacementDraftRequiredTitleRule implements StrictPlacementDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPlacementDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPlacementDraftCodePrefixRule implements StrictPlacementDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictPlacementDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictPlacementDraftRequiredCodeRule implements StrictPlacementDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPlacementDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPlacementDraftBatchSizeRangeRule implements StrictPlacementDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPlacementDraft): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict placement draft. */
export class StrictPlacementDraftValidator {
  rules: StrictPlacementDraftRule[];

  constructor(rules: StrictPlacementDraftRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPlacementDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPlacementDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPlacementDraft[]): Map<string, string[]> {
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

export function defaultStrictPlacementDraftValidator(): StrictPlacementDraftValidator {
  return new StrictPlacementDraftValidator(
    [
      new StrictPlacementDraftRequiredSummaryRule("strict placement draft needs an entry"),
      new StrictPlacementDraftRequiredTitleRule("strict placement draft needs an entry"),
      new StrictPlacementDraftCodePrefixRule("OPS"),
      new StrictPlacementDraftRequiredCodeRule("strict placement draft needs an entry"),
      new StrictPlacementDraftBatchSizeRangeRule(80, 80),
    ],
  );
}
