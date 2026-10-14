import { ConversionTemplate } from "./conversion-template.js";

/** A rule a conversion template must pass. Check returns its problems, or none. */
export interface ConversionTemplateRule {
  check(item: ConversionTemplate): string[];
}

export class ConversionTemplateRequiredJourneyIdRule implements ConversionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionTemplate): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionTemplateTimezoneLengthRule implements ConversionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionTemplate): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionTemplateRateRangeRule implements ConversionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionTemplate): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionTemplateCodePrefixRule implements ConversionTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a conversion template. */
export class ConversionTemplateValidator {
  rules: ConversionTemplateRule[];

  constructor(rules: ConversionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionTemplate): string[] {
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

  requireValid(item: ConversionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionTemplate[]): Map<string, string[]> {
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

export function defaultConversionTemplateValidator(): ConversionTemplateValidator {
  return new ConversionTemplateValidator(
    [
      new ConversionTemplateRequiredJourneyIdRule("conversion template needs an entry"),
      new ConversionTemplateTimezoneLengthRule(255),
      new ConversionTemplateRateRangeRule(9.1, 1991.9),
      new ConversionTemplateCodePrefixRule("Q"),
    ],
  );
}
