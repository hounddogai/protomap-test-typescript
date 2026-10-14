import { TieredTierCycle } from "./tiered-tier-cycle.js";

/** A rule a tiered tier cycle must pass. Check returns its problems, or none. */
export interface TieredTierCycleRule {
  check(item: TieredTierCycle): string[];
}

export class TieredTierCycleCodeLengthRule implements TieredTierCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTierCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTierCycleRequiredLabelRule implements TieredTierCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTierCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTierCycleRequiredRegionRule implements TieredTierCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTierCycle): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered tier cycle. */
export class TieredTierCycleValidator {
  rules: TieredTierCycleRule[];

  constructor(rules: TieredTierCycleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTierCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredTierCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTierCycle[]): Map<string, string[]> {
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

export function defaultTieredTierCycleValidator(): TieredTierCycleValidator {
  return new TieredTierCycleValidator(
    [
      new TieredTierCycleCodeLengthRule(255),
      new TieredTierCycleRequiredLabelRule("tiered tier cycle needs a value"),
      new TieredTierCycleRequiredRegionRule("tiered tier cycle needs an entry"),
    ],
  );
}
