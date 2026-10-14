import * as text from "../../../../kit/text.js";
import { PlacementOverride } from "./placement-override.js";

/** A rule a placement override must pass. Check returns its problems, or none. */
export interface PlacementOverrideRule {
  check(item: PlacementOverride): string[];
}

export class PlacementOverrideChannelLengthRule implements PlacementOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementOverride): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementOverrideAllowedAudienceIdRule implements PlacementOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is missing`];
    return [];
  }
}

export class PlacementOverrideRequiredTitleRule implements PlacementOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementOverrideCodePrefixRule implements PlacementOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementOverrideFloorValueRangeRule implements PlacementOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementOverride): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a placement override. */
export class PlacementOverrideValidator {
  rules: PlacementOverrideRule[];

  constructor(rules: PlacementOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementOverride[]): Map<string, string[]> {
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

export function defaultPlacementOverrideValidator(): PlacementOverrideValidator {
  return new PlacementOverrideValidator(
    [
      new PlacementOverrideChannelLengthRule(16),
      new PlacementOverrideAllowedAudienceIdRule(["scheduled", "rolling"]),
      new PlacementOverrideRequiredTitleRule("placement override needs an entry"),
      new PlacementOverrideCodePrefixRule("Q"),
      new PlacementOverrideFloorValueRangeRule(0.9, 3330.9),
    ],
  );
}
