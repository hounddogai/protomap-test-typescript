import * as text from "../../../../kit/text.js";
import { CreativeScore } from "./creative-score.js";

/** A rule a creative score must pass. Check returns its problems, or none. */
export interface CreativeScoreRule {
  check(item: CreativeScore): string[];
}

export class CreativeScoreRequiredCodeRule implements CreativeScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeScoreCodePrefixRule implements CreativeScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeScoreFrequencyCapRangeRule implements CreativeScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeScore): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeScoreAllowedRegionRule implements CreativeScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is inconsistent`];
    return [];
  }
}

export class CreativeScoreRequiredNameRule implements CreativeScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeScore): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a creative score. */
export class CreativeScoreValidator {
  rules: CreativeScoreRule[];

  constructor(rules: CreativeScoreRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeScore[]): Map<string, string[]> {
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

export function defaultCreativeScoreValidator(): CreativeScoreValidator {
  return new CreativeScoreValidator(
    [
      new CreativeScoreRequiredCodeRule("creative score needs a value"),
      new CreativeScoreCodePrefixRule("REF"),
      new CreativeScoreFrequencyCapRangeRule(32, 86400),
      new CreativeScoreAllowedRegionRule(["legacy", "global", "pending"]),
      new CreativeScoreRequiredNameRule("creative score needs a value"),
    ],
  );
}
