import { TicketViewThreshold } from "./ticket-view-threshold.js";

/** A rule a ticket view threshold must pass. Check returns its problems, or none. */
export interface TicketViewThresholdRule {
  check(item: TicketViewThreshold): string[];
}

export class TicketViewThresholdFloorValueRangeRule implements TicketViewThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewThreshold): string[] {
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

export class TicketViewThresholdRequiredLocaleRule implements TicketViewThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewThreshold): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewThresholdCodePrefixRule implements TicketViewThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewThresholdVersionRangeRule implements TicketViewThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewThreshold): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a ticket view threshold. */
export class TicketViewThresholdValidator {
  rules: TicketViewThresholdRule[];

  constructor(rules: TicketViewThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewThreshold): string[] {
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

  requireValid(item: TicketViewThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewThreshold[]): Map<string, string[]> {
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

export function defaultTicketViewThresholdValidator(): TicketViewThresholdValidator {
  return new TicketViewThresholdValidator(
    [
      new TicketViewThresholdFloorValueRangeRule(1.5, 4308.8),
      new TicketViewThresholdRequiredLocaleRule("ticket view threshold needs an entry"),
      new TicketViewThresholdCodePrefixRule("OPS"),
      new TicketViewThresholdVersionRangeRule(120, 86400),
    ],
  );
}
