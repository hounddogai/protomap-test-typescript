import { PostReservation } from "./post-reservation.js";

/** A rule a post reservation must pass. Check returns its problems, or none. */
export interface PostReservationRule {
  check(item: PostReservation): string[];
}

export class PostReservationRequiredTitleRule implements PostReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PostReservationVisibleGuardRule implements PostReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PostReservation): string[] {
    if (item.visible && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PostReservationWindowDaysRangeRule implements PostReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostReservation): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostReservationCodePrefixRule implements PostReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostReservationTitleLengthRule implements PostReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostReservationCapacityRangeRule implements PostReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostReservation): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a post reservation. */
export class PostReservationValidator {
  rules: PostReservationRule[];

  constructor(rules: PostReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PostReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostReservation[]): Map<string, string[]> {
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

export function defaultPostReservationValidator(): PostReservationValidator {
  return new PostReservationValidator(
    [
      new PostReservationRequiredTitleRule("post reservation needs an entry"),
      new PostReservationVisibleGuardRule(80),
      new PostReservationWindowDaysRangeRule(120, 1000),
      new PostReservationCodePrefixRule("OPS"),
      new PostReservationTitleLengthRule(3600),
      new PostReservationCapacityRangeRule(1000, 86400),
    ],
  );
}
