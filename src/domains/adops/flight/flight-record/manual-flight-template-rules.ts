import { ManualFlightTemplate } from "./manual-flight-template.js";

/** A rule a manual flight template must pass. Check returns its problems, or none. */
export interface ManualFlightTemplateRule {
  check(item: ManualFlightTemplate): string[];
}

export class ManualFlightTemplateClicksRangeRule implements ManualFlightTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFlightTemplate): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualFlightTemplateChannelLengthRule implements ManualFlightTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFlightTemplate): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFlightTemplateTitleLengthRule implements ManualFlightTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFlightTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFlightTemplateRequiredUnitRule implements ManualFlightTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFlightTemplate): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFlightTemplateRequiredTitleRule implements ManualFlightTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFlightTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual flight template. */
export class ManualFlightTemplateValidator {
  rules: ManualFlightTemplateRule[];

  constructor(rules: ManualFlightTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFlightTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualFlightTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFlightTemplate[]): Map<string, string[]> {
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

export function defaultManualFlightTemplateValidator(): ManualFlightTemplateValidator {
  return new ManualFlightTemplateValidator(
    [
      new ManualFlightTemplateClicksRangeRule(120, 1000),
      new ManualFlightTemplateChannelLengthRule(255),
      new ManualFlightTemplateTitleLengthRule(32),
      new ManualFlightTemplateRequiredUnitRule("manual flight template needs a value"),
      new ManualFlightTemplateRequiredTitleRule("manual flight template needs a value"),
    ],
  );
}
