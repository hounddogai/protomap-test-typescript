import { ConversionSchedule } from "./conversion-schedule.js";

/** A rule a conversion schedule must pass. Check returns its problems, or none. */
export interface ConversionScheduleRule {
  check(item: ConversionSchedule): string[];
}

export class ConversionScheduleCodePrefixRule implements ConversionScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionScheduleTagsLimitRule implements ConversionScheduleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ConversionSchedule): string[] {
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

export class ConversionScheduleRequiredNotesRule implements ConversionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionSchedule): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionScheduleRequiredLabelRule implements ConversionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion schedule. */
export class ConversionScheduleValidator {
  rules: ConversionScheduleRule[];

  constructor(rules: ConversionScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionSchedule): string[] {
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

  requireValid(item: ConversionSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionSchedule[]): Map<string, string[]> {
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

export function defaultConversionScheduleValidator(): ConversionScheduleValidator {
  return new ConversionScheduleValidator(
    [
      new ConversionScheduleCodePrefixRule("ACM"),
      new ConversionScheduleTagsLimitRule(80, ["scheduled", "adaptive", "weighted"]),
      new ConversionScheduleRequiredNotesRule("conversion schedule needs a value"),
      new ConversionScheduleRequiredLabelRule("conversion schedule needs a value"),
    ],
  );
}
