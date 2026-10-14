import { PrimaryTouchpointTarget } from "./primary-touchpoint-target.js";

/** A rule a primary touchpoint target must pass. Check returns its problems, or none. */
export interface PrimaryTouchpointTargetRule {
  check(item: PrimaryTouchpointTarget): string[];
}

export class PrimaryTouchpointTargetVariantLengthRule implements PrimaryTouchpointTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTouchpointTarget): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTouchpointTargetRequiredVariantRule implements PrimaryTouchpointTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTouchpointTarget): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTouchpointTargetRequiredNameRule implements PrimaryTouchpointTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTouchpointTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTouchpointTargetRequiredCodeRule implements PrimaryTouchpointTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTouchpointTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTouchpointTargetCodePrefixRule implements PrimaryTouchpointTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryTouchpointTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary touchpoint target. */
export class PrimaryTouchpointTargetValidator {
  rules: PrimaryTouchpointTargetRule[];

  constructor(rules: PrimaryTouchpointTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTouchpointTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryTouchpointTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTouchpointTarget[]): Map<string, string[]> {
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

export function defaultPrimaryTouchpointTargetValidator(): PrimaryTouchpointTargetValidator {
  return new PrimaryTouchpointTargetValidator(
    [
      new PrimaryTouchpointTargetVariantLengthRule(32),
      new PrimaryTouchpointTargetRequiredVariantRule("primary touchpoint target needs a value"),
      new PrimaryTouchpointTargetRequiredNameRule("primary touchpoint target needs an entry"),
      new PrimaryTouchpointTargetRequiredCodeRule("primary touchpoint target needs a value"),
      new PrimaryTouchpointTargetCodePrefixRule("OPS"),
    ],
  );
}
