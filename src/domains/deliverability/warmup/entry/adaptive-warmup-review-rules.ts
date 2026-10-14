import { AdaptiveWarmupReview } from "./adaptive-warmup-review.js";

/** A rule a adaptive warmup review must pass. Check returns its problems, or none. */
export interface AdaptiveWarmupReviewRule {
  check(item: AdaptiveWarmupReview): string[];
}

export class AdaptiveWarmupReviewRequiredCodeRule implements AdaptiveWarmupReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWarmupReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWarmupReviewRequiredNameRule implements AdaptiveWarmupReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWarmupReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWarmupReviewCodePrefixRule implements AdaptiveWarmupReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveWarmupReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive warmup review. */
export class AdaptiveWarmupReviewValidator {
  rules: AdaptiveWarmupReviewRule[];

  constructor(rules: AdaptiveWarmupReviewRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveWarmupReview): string[] {
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

  requireValid(item: AdaptiveWarmupReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveWarmupReview[]): Map<string, string[]> {
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

export function defaultAdaptiveWarmupReviewValidator(): AdaptiveWarmupReviewValidator {
  return new AdaptiveWarmupReviewValidator(
    [
      new AdaptiveWarmupReviewRequiredCodeRule("adaptive warmup review needs this field"),
      new AdaptiveWarmupReviewRequiredNameRule("adaptive warmup review needs this field"),
      new AdaptiveWarmupReviewCodePrefixRule("OPS"),
    ],
  );
}
