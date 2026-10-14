import { BatchedFunnelMapping } from "./batched-funnel-mapping.js";

/** A rule a batched funnel mapping must pass. Check returns its problems, or none. */
export interface BatchedFunnelMappingRule {
  check(item: BatchedFunnelMapping): string[];
}

export class BatchedFunnelMappingRequiredTitleRule implements BatchedFunnelMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFunnelMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFunnelMappingRequiredCodeRule implements BatchedFunnelMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFunnelMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFunnelMappingCodePrefixRule implements BatchedFunnelMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFunnelMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedFunnelMappingDurationMinutesRangeRule implements BatchedFunnelMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFunnelMapping): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedFunnelMappingUnitLengthRule implements BatchedFunnelMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFunnelMapping): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched funnel mapping. */
export class BatchedFunnelMappingValidator {
  rules: BatchedFunnelMappingRule[];

  constructor(rules: BatchedFunnelMappingRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFunnelMapping): string[] {
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

  requireValid(item: BatchedFunnelMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFunnelMapping[]): Map<string, string[]> {
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

export function defaultBatchedFunnelMappingValidator(): BatchedFunnelMappingValidator {
  return new BatchedFunnelMappingValidator(
    [
      new BatchedFunnelMappingRequiredTitleRule("batched funnel mapping needs a value"),
      new BatchedFunnelMappingRequiredCodeRule("batched funnel mapping needs a value"),
      new BatchedFunnelMappingCodePrefixRule("ACM"),
      new BatchedFunnelMappingDurationMinutesRangeRule(80, 120),
      new BatchedFunnelMappingUnitLengthRule(3600),
    ],
  );
}
