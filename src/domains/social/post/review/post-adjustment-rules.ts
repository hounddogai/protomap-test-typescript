import { PostAdjustment } from "./post-adjustment.js";

/** A rule a post adjustment must pass. Check returns its problems, or none. */
export interface PostAdjustmentRule {
  check(item: PostAdjustment): string[];
}

export class PostAdjustmentRequiredUtmSourceRule implements PostAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostAdjustment): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PostAdjustmentCodePrefixRule implements PostAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostAdjustmentTitleLengthRule implements PostAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post adjustment. */
export class PostAdjustmentValidator {
  rules: PostAdjustmentRule[];

  constructor(rules: PostAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PostAdjustment): string[] {
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

  requireValid(item: PostAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostAdjustment[]): Map<string, string[]> {
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

export function defaultPostAdjustmentValidator(): PostAdjustmentValidator {
  return new PostAdjustmentValidator(
    [
      new PostAdjustmentRequiredUtmSourceRule("post adjustment needs a value"),
      new PostAdjustmentCodePrefixRule("OPS"),
      new PostAdjustmentTitleLengthRule(1000),
    ],
  );
}
