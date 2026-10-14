import { WindowMapping } from "./window-mapping.js";

/** A rule a window mapping must pass. Check returns its problems, or none. */
export interface WindowMappingRule {
  check(item: WindowMapping): string[];
}

export class WindowMappingRequiredDescriptionRule implements WindowMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowMapping): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class WindowMappingAudienceIdLengthRule implements WindowMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowMapping): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowMappingDescriptionLengthRule implements WindowMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowMapping): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowMappingRequiredAudienceIdRule implements WindowMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowMapping): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window mapping. */
export class WindowMappingValidator {
  rules: WindowMappingRule[];

  constructor(rules: WindowMappingRule[]) {
    this.rules = rules;
  }

  validate(item: WindowMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowMapping[]): Map<string, string[]> {
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

export function defaultWindowMappingValidator(): WindowMappingValidator {
  return new WindowMappingValidator(
    [
      new WindowMappingRequiredDescriptionRule("window mapping needs this field"),
      new WindowMappingAudienceIdLengthRule(120),
      new WindowMappingDescriptionLengthRule(255),
      new WindowMappingRequiredAudienceIdRule("window mapping needs this field"),
    ],
  );
}
