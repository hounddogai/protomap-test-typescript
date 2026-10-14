import { PostAllocation } from "./post-allocation.js";

/** A rule a post allocation must pass. Check returns its problems, or none. */
export interface PostAllocationRule {
  check(item: PostAllocation): string[];
}

export class PostAllocationAttemptsRangeRule implements PostAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostAllocation): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostAllocationFloorValueRangeRule implements PostAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostAllocation): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostAllocationCodeLengthRule implements PostAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostAllocationRequiredLabelRule implements PostAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PostAllocationCodePrefixRule implements PostAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a post allocation. */
export class PostAllocationValidator {
  rules: PostAllocationRule[];

  constructor(rules: PostAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: PostAllocation): string[] {
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

  requireValid(item: PostAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostAllocation[]): Map<string, string[]> {
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

export function defaultPostAllocationValidator(): PostAllocationValidator {
  return new PostAllocationValidator(
    [
      new PostAllocationAttemptsRangeRule(32, 80),
      new PostAllocationFloorValueRangeRule(7.8, 2807.1),
      new PostAllocationCodeLengthRule(32),
      new PostAllocationRequiredLabelRule("post allocation needs a value"),
      new PostAllocationCodePrefixRule("REF"),
    ],
  );
}
