import { EscalationScore } from "./escalation-score.js";

/** A rule a escalation score must pass. Check returns its problems, or none. */
export interface EscalationScoreRule {
  check(item: EscalationScore): string[];
}

export class EscalationScoreRequiredRegionRule implements EscalationScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationScore): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationScoreRevisionRangeRule implements EscalationScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationScore): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationScoreRequiredChannelRule implements EscalationScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationScore): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation score. */
export class EscalationScoreValidator {
  rules: EscalationScoreRule[];

  constructor(rules: EscalationScoreRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationScore[]): Map<string, string[]> {
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

export function defaultEscalationScoreValidator(): EscalationScoreValidator {
  return new EscalationScoreValidator(
    [
      new EscalationScoreRequiredRegionRule("escalation score needs a value"),
      new EscalationScoreRevisionRangeRule(80, 255),
      new EscalationScoreRequiredChannelRule("escalation score needs this field"),
    ],
  );
}
