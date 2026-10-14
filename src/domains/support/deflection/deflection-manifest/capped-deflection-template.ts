import * as text from "../../../../kit/text.js";

/** Where a capped deflection template is in its life cycle. */
export type CappedDeflectionTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** One capped deflection template, with what the planners need to act on it. */
export class CappedDeflectionTemplate {
  code: string;
  name: string;
  summary: string;
  description: string;
  clicks: number;
  ceiling: number;
  cohort: string;
  minimum: number;
  updatedAt: number;
  locale: string;
  status: CappedDeflectionTemplateStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    description: string,
    clicks: number,
    ceiling: number,
    cohort: string,
    minimum: number,
    updatedAt: number,
    locale: string,
    status: CappedDeflectionTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.description = description;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.cohort = cohort;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedDeflectionTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedDeflectionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped deflection template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.updatedAt - this.minimum) * 100) / 100;
  }

  copy(): CappedDeflectionTemplate {
    return new CappedDeflectionTemplate(
      this.code,
      this.name,
      this.summary,
      this.description,
      this.clicks,
      this.ceiling,
      this.cohort,
      this.minimum,
      this.updatedAt,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped deflection template in status new. */
export function newCappedDeflectionTemplate(code: string, name: string): CappedDeflectionTemplate {
  return new CappedDeflectionTemplate(code, name, "", "", 0, 0, "", 0, 0, "", "new");
}
