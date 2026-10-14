import { TieredSuppressionSegment } from "./tiered-suppression-segment.js";

/** A rule a tiered suppression segment must pass. Check returns its problems, or none. */
export interface TieredSuppressionSegmentRule {
  check(item: TieredSuppressionSegment): string[];
}

export class TieredSuppressionSegmentRequiredCodeRule implements TieredSuppressionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSuppressionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSuppressionSegmentCodePrefixRule implements TieredSuppressionSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredSuppressionSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredSuppressionSegmentRequiredExternalRefRule implements TieredSuppressionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSuppressionSegment): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered suppression segment. */
export class TieredSuppressionSegmentValidator {
  rules: TieredSuppressionSegmentRule[];

  constructor(rules: TieredSuppressionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSuppressionSegment): string[] {
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

  requireValid(item: TieredSuppressionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSuppressionSegment[]): Map<string, string[]> {
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

export function defaultTieredSuppressionSegmentValidator(): TieredSuppressionSegmentValidator {
  return new TieredSuppressionSegmentValidator(
    [
      new TieredSuppressionSegmentRequiredCodeRule("tiered suppression segment needs an entry"),
      new TieredSuppressionSegmentCodePrefixRule("Q"),
      new TieredSuppressionSegmentRequiredExternalRefRule("tiered suppression segment needs an entry"),
    ],
  );
}
