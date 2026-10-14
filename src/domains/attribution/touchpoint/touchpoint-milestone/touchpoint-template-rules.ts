import { TouchpointTemplate } from "./touchpoint-template.js";

/** A rule a touchpoint template must pass. Check returns its problems, or none. */
export interface TouchpointTemplateRule {
  check(item: TouchpointTemplate): string[];
}

export class TouchpointTemplateRequiredNameRule implements TouchpointTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointTemplateCodeLengthRule implements TouchpointTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointTemplateRequiredCodeRule implements TouchpointTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointTemplateCostRangeRule implements TouchpointTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointTemplate): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointTemplateChannelLengthRule implements TouchpointTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointTemplate): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a touchpoint template. */
export class TouchpointTemplateValidator {
  rules: TouchpointTemplateRule[];

  constructor(rules: TouchpointTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointTemplate[]): Map<string, string[]> {
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

export function defaultTouchpointTemplateValidator(): TouchpointTemplateValidator {
  return new TouchpointTemplateValidator(
    [
      new TouchpointTemplateRequiredNameRule("touchpoint template needs an entry"),
      new TouchpointTemplateCodeLengthRule(255),
      new TouchpointTemplateRequiredCodeRule("touchpoint template needs a value"),
      new TouchpointTemplateCostRangeRule(8.9, 4332.3),
      new TouchpointTemplateChannelLengthRule(16),
    ],
  );
}
