import * as text from "../../../../kit/text.js";

/** Where a scheduled insight template is in its life cycle. */
export type ScheduledInsightTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled insight template. Its code is unique within a tenant. */
export class ScheduledInsightTemplate {
  code: string;
  title: string;
  tags: string[];
  sequence: number;
  unit: string;
  version: number;
  active: boolean;
  minimum: number;
  status: ScheduledInsightTemplateStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    sequence: number,
    unit: string,
    version: number,
    active: boolean,
    minimum: number,
    status: ScheduledInsightTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.sequence = sequence;
    this.unit = unit;
    this.version = version;
    this.active = active;
    this.minimum = minimum;
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

  canMoveTo(next: ScheduledInsightTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ScheduledInsightTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled insight template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.sequence - this.minimum) * 100) / 100;
  }

  copy(): ScheduledInsightTemplate {
    return new ScheduledInsightTemplate(
      this.code,
      this.title,
      this.tags,
      this.sequence,
      this.unit,
      this.version,
      this.active,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled insight template in status new. */
export function newScheduledInsightTemplate(code: string, title: string): ScheduledInsightTemplate {
  return new ScheduledInsightTemplate(code, title, [], 0, "", 0, false, 0, "new");
}
