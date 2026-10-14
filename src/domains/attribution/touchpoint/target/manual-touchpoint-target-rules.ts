import { ManualTouchpointTarget } from "./manual-touchpoint-target.js";

/** A rule a manual touchpoint target must pass. Check returns its problems, or none. */
export interface ManualTouchpointTargetRule {
  check(item: ManualTouchpointTarget): string[];
}

export class ManualTouchpointTargetClicksRangeRule implements ManualTouchpointTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointTarget): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualTouchpointTargetSequenceRangeRule implements ManualTouchpointTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointTarget): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualTouchpointTargetRequiredLabelRule implements ManualTouchpointTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTouchpointTarget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTouchpointTargetPriorityRangeRule implements ManualTouchpointTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointTarget): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual touchpoint target. */
export class ManualTouchpointTargetValidator {
  rules: ManualTouchpointTargetRule[];

  constructor(rules: ManualTouchpointTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTouchpointTarget): string[] {
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

  requireValid(item: ManualTouchpointTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTouchpointTarget[]): Map<string, string[]> {
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

export function defaultManualTouchpointTargetValidator(): ManualTouchpointTargetValidator {
  return new ManualTouchpointTargetValidator(
    [
      new ManualTouchpointTargetClicksRangeRule(1000, 3600),
      new ManualTouchpointTargetSequenceRangeRule(120, 255),
      new ManualTouchpointTargetRequiredLabelRule("manual touchpoint target needs an entry"),
      new ManualTouchpointTargetPriorityRangeRule(32, 86400),
    ],
  );
}
