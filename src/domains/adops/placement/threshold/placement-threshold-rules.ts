import { PlacementThreshold } from "./placement-threshold.js";

/** A rule a placement threshold must pass. Check returns its problems, or none. */
export interface PlacementThresholdRule {
  check(item: PlacementThreshold): string[];
}

export class PlacementThresholdNameLengthRule implements PlacementThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementThresholdRequiredNameRule implements PlacementThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementThresholdCodeLengthRule implements PlacementThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a placement threshold. */
export class PlacementThresholdValidator {
  rules: PlacementThresholdRule[];

  constructor(rules: PlacementThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementThreshold): string[] {
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

  requireValid(item: PlacementThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementThreshold[]): Map<string, string[]> {
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

export function defaultPlacementThresholdValidator(): PlacementThresholdValidator {
  return new PlacementThresholdValidator(
    [
      new PlacementThresholdNameLengthRule(32),
      new PlacementThresholdRequiredNameRule("placement threshold needs this field"),
      new PlacementThresholdCodeLengthRule(64),
    ],
  );
}
