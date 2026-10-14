import * as text from "../../../../kit/text.js";
import { CreativeEstimate } from "./creative-estimate.js";

/** A rule a creative estimate must pass. Check returns its problems, or none. */
export interface CreativeEstimateRule {
  check(item: CreativeEstimate): string[];
}

export class CreativeEstimateOpenRateRangeRule implements CreativeEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeEstimate): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeEstimateAllowedCodeRule implements CreativeEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class CreativeEstimateRequiredCodeRule implements CreativeEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeEstimateRequiredChannelRule implements CreativeEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeEstimate): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeEstimateCodePrefixRule implements CreativeEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a creative estimate. */
export class CreativeEstimateValidator {
  rules: CreativeEstimateRule[];

  constructor(rules: CreativeEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeEstimate[]): Map<string, string[]> {
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

export function defaultCreativeEstimateValidator(): CreativeEstimateValidator {
  return new CreativeEstimateValidator(
    [
      new CreativeEstimateOpenRateRangeRule(8.1, 2986.7),
      new CreativeEstimateAllowedCodeRule(["legacy", "primary"]),
      new CreativeEstimateRequiredCodeRule("creative estimate needs an entry"),
      new CreativeEstimateRequiredChannelRule("creative estimate needs this field"),
      new CreativeEstimateCodePrefixRule("ACM"),
    ],
  );
}
