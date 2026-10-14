import { CreativeException } from "./creative-exception.js";

/** A rule a creative exception must pass. Check returns its problems, or none. */
export interface CreativeExceptionRule {
  check(item: CreativeException): string[];
}

export class CreativeExceptionFloorValueRangeRule implements CreativeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeException): string[] {
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

export class CreativeExceptionCodeLengthRule implements CreativeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeExceptionRequiredNameRule implements CreativeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeExceptionDurationMinutesRangeRule implements CreativeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeException): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeExceptionRequiredSegmentRule implements CreativeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeException): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeExceptionMaximumRangeRule implements CreativeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeException): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a creative exception. */
export class CreativeExceptionValidator {
  rules: CreativeExceptionRule[];

  constructor(rules: CreativeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeException[]): Map<string, string[]> {
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

export function defaultCreativeExceptionValidator(): CreativeExceptionValidator {
  return new CreativeExceptionValidator(
    [
      new CreativeExceptionFloorValueRangeRule(5.4, 3413.4),
      new CreativeExceptionCodeLengthRule(120),
      new CreativeExceptionRequiredNameRule("creative exception needs a value"),
      new CreativeExceptionDurationMinutesRangeRule(32, 120),
      new CreativeExceptionRequiredSegmentRule("creative exception needs this field"),
      new CreativeExceptionMaximumRangeRule(3, 2401.5),
    ],
  );
}
