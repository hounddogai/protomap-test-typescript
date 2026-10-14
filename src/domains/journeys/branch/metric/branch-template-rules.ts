import { BranchTemplate } from "./branch-template.js";

/** A rule a branch template must pass. Check returns its problems, or none. */
export interface BranchTemplateRule {
  check(item: BranchTemplate): string[];
}

export class BranchTemplateRevisionRangeRule implements BranchTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchTemplate): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchTemplateRequiredCohortRule implements BranchTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchTemplate): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class BranchTemplateRequiredCampaignRefRule implements BranchTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchTemplate): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class BranchTemplateStartsAtRangeRule implements BranchTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchTemplate): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchTemplateBatchSizeRangeRule implements BranchTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchTemplate): string[] {
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

/** Runs every rule of a branch template. */
export class BranchTemplateValidator {
  rules: BranchTemplateRule[];

  constructor(rules: BranchTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BranchTemplate): string[] {
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

  requireValid(item: BranchTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchTemplate[]): Map<string, string[]> {
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

export function defaultBranchTemplateValidator(): BranchTemplateValidator {
  return new BranchTemplateValidator(
    [
      new BranchTemplateRevisionRangeRule(16, 1000),
      new BranchTemplateRequiredCohortRule("branch template needs an entry"),
      new BranchTemplateRequiredCampaignRefRule("branch template needs an entry"),
      new BranchTemplateStartsAtRangeRule(64, 255),
      new BranchTemplateBatchSizeRangeRule(80, 86400),
    ],
  );
}
