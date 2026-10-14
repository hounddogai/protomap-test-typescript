import * as text from "../../../../kit/text.js";
import { FallbackPacingMetric } from "./fallback-pacing-metric.js";

/** A rule a fallback pacing metric must pass. Check returns its problems, or none. */
export interface FallbackPacingMetricRule {
  check(item: FallbackPacingMetric): string[];
}

export class FallbackPacingMetricAllowedSummaryRule implements FallbackPacingMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPacingMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is not allowed`];
    return [];
  }
}

export class FallbackPacingMetricRequiredTitleRule implements FallbackPacingMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPacingMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPacingMetricRequiredUtmSourceRule implements FallbackPacingMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPacingMetric): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPacingMetricCodePrefixRule implements FallbackPacingMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPacingMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackPacingMetricRequiredCodeRule implements FallbackPacingMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPacingMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback pacing metric. */
export class FallbackPacingMetricValidator {
  rules: FallbackPacingMetricRule[];

  constructor(rules: FallbackPacingMetricRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPacingMetric): string[] {
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

  requireValid(item: FallbackPacingMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPacingMetric[]): Map<string, string[]> {
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

export function defaultFallbackPacingMetricValidator(): FallbackPacingMetricValidator {
  return new FallbackPacingMetricValidator(
    [
      new FallbackPacingMetricAllowedSummaryRule(["lenient"]),
      new FallbackPacingMetricRequiredTitleRule("fallback pacing metric needs an entry"),
      new FallbackPacingMetricRequiredUtmSourceRule("fallback pacing metric needs this field"),
      new FallbackPacingMetricCodePrefixRule("REF"),
      new FallbackPacingMetricRequiredCodeRule("fallback pacing metric needs this field"),
    ],
  );
}
