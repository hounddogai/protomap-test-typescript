import { FlightSlot } from "./flight-slot.js";

/** A rule a flight slot must pass. Check returns its problems, or none. */
export interface FlightSlotRule {
  check(item: FlightSlot): string[];
}

export class FlightSlotRequiredTitleRule implements FlightSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FlightSlotAttemptsRangeRule implements FlightSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightSlot): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FlightSlotLocaleLengthRule implements FlightSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightSlot): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightSlotCodePrefixRule implements FlightSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FlightSlotTagsLimitRule implements FlightSlotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FlightSlot): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class FlightSlotPinnedGuardRule implements FlightSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FlightSlot): string[] {
    if (item.pinned && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a flight slot. */
export class FlightSlotValidator {
  rules: FlightSlotRule[];

  constructor(rules: FlightSlotRule[]) {
    this.rules = rules;
  }

  validate(item: FlightSlot): string[] {
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

  requireValid(item: FlightSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightSlot[]): Map<string, string[]> {
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

export function defaultFlightSlotValidator(): FlightSlotValidator {
  return new FlightSlotValidator(
    [
      new FlightSlotRequiredTitleRule("flight slot needs an entry"),
      new FlightSlotAttemptsRangeRule(3600, 86400),
      new FlightSlotLocaleLengthRule(80),
      new FlightSlotCodePrefixRule("OPS"),
      new FlightSlotTagsLimitRule(120, ["default", "default"]),
      new FlightSlotPinnedGuardRule(8.6),
    ],
  );
}
