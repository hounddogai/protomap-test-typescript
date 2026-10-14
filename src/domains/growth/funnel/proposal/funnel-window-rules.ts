import { FunnelWindow } from "./funnel-window.js";

/** A rule a funnel window must pass. Check returns its problems, or none. */
export interface FunnelWindowRule {
  check(item: FunnelWindow): string[];
}

export class FunnelWindowRequiredNameRule implements FunnelWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelWindowChannelLengthRule implements FunnelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelWindow): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelWindowUtmSourceLengthRule implements FunnelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelWindow): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelWindowVersionRangeRule implements FunnelWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelWindow): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelWindowCodeLengthRule implements FunnelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelWindowRevisionRangeRule implements FunnelWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelWindow): string[] {
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

/** Runs every rule of a funnel window. */
export class FunnelWindowValidator {
  rules: FunnelWindowRule[];

  constructor(rules: FunnelWindowRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelWindow): string[] {
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

  requireValid(item: FunnelWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelWindow[]): Map<string, string[]> {
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

export function defaultFunnelWindowValidator(): FunnelWindowValidator {
  return new FunnelWindowValidator(
    [
      new FunnelWindowRequiredNameRule("funnel window needs an entry"),
      new FunnelWindowChannelLengthRule(3600),
      new FunnelWindowUtmSourceLengthRule(255),
      new FunnelWindowVersionRangeRule(64, 64),
      new FunnelWindowCodeLengthRule(255),
      new FunnelWindowRevisionRangeRule(120, 1000),
    ],
  );
}
