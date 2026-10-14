import { GlobalModelTier } from "./global-model-tier.js";

/** A rule a global model tier must pass. Check returns its problems, or none. */
export interface GlobalModelTierRule {
  check(item: GlobalModelTier): string[];
}

export class GlobalModelTierRequiredContactEmailRule implements GlobalModelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalModelTier): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalModelTierPriorityRangeRule implements GlobalModelTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalModelTier): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalModelTierRequiredUnitRule implements GlobalModelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalModelTier): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalModelTierCodeLengthRule implements GlobalModelTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalModelTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global model tier. */
export class GlobalModelTierValidator {
  rules: GlobalModelTierRule[];

  constructor(rules: GlobalModelTierRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalModelTier): string[] {
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

  requireValid(item: GlobalModelTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalModelTier[]): Map<string, string[]> {
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

export function defaultGlobalModelTierValidator(): GlobalModelTierValidator {
  return new GlobalModelTierValidator(
    [
      new GlobalModelTierRequiredContactEmailRule("global model tier needs a value"),
      new GlobalModelTierPriorityRangeRule(64, 64),
      new GlobalModelTierRequiredUnitRule("global model tier needs an entry"),
      new GlobalModelTierCodeLengthRule(120),
    ],
  );
}
