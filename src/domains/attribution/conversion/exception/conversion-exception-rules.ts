import { ConversionException } from "./conversion-exception.js";

/** A rule a conversion exception must pass. Check returns its problems, or none. */
export interface ConversionExceptionRule {
  check(item: ConversionException): string[];
}

export class ConversionExceptionNameLengthRule implements ConversionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionExceptionCeilingRangeRule implements ConversionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionException): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionExceptionRequiredCodeRule implements ConversionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionExceptionMinimumRangeRule implements ConversionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionException): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a conversion exception. */
export class ConversionExceptionValidator {
  rules: ConversionExceptionRule[];

  constructor(rules: ConversionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionException[]): Map<string, string[]> {
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

export function defaultConversionExceptionValidator(): ConversionExceptionValidator {
  return new ConversionExceptionValidator(
    [
      new ConversionExceptionNameLengthRule(120),
      new ConversionExceptionCeilingRangeRule(7.5, 1509.4),
      new ConversionExceptionRequiredCodeRule("conversion exception needs this field"),
      new ConversionExceptionMinimumRangeRule(8.6, 1743.4),
    ],
  );
}
