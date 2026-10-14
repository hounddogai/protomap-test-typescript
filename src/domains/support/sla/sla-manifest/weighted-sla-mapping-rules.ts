import { WeightedSlaMapping } from "./weighted-sla-mapping.js";

/** A rule a weighted sla mapping must pass. Check returns its problems, or none. */
export interface WeightedSlaMappingRule {
  check(item: WeightedSlaMapping): string[];
}

export class WeightedSlaMappingAudienceIdLengthRule implements WeightedSlaMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSlaMapping): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedSlaMappingVisibleGuardRule implements WeightedSlaMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedSlaMapping): string[] {
    if (item.visible && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class WeightedSlaMappingCodeLengthRule implements WeightedSlaMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSlaMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedSlaMappingCodePrefixRule implements WeightedSlaMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedSlaMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted sla mapping. */
export class WeightedSlaMappingValidator {
  rules: WeightedSlaMappingRule[];

  constructor(rules: WeightedSlaMappingRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedSlaMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedSlaMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedSlaMapping[]): Map<string, string[]> {
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

export function defaultWeightedSlaMappingValidator(): WeightedSlaMappingValidator {
  return new WeightedSlaMappingValidator(
    [
      new WeightedSlaMappingAudienceIdLengthRule(64),
      new WeightedSlaMappingVisibleGuardRule(64),
      new WeightedSlaMappingCodeLengthRule(3600),
      new WeightedSlaMappingCodePrefixRule("OPS"),
    ],
  );
}
