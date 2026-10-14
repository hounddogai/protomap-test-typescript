import * as text from "../../../../kit/text.js";

/** Where a step template is in its life cycle. */
export type StepTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One step template, with what the planners need to act on it. */
export class StepTemplate {
  code: string;
  name: string;
  unit: string;
  createdAt: number;
  audienceId: string;
  tags: string[];
  limit: number;
  segment: string;
  label: string;
  title: string;
  quantity: number;
  status: StepTemplateStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    createdAt: number,
    audienceId: string,
    tags: string[],
    limit: number,
    segment: string,
    label: string,
    title: string,
    quantity: number,
    status: StepTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.createdAt = createdAt;
    this.audienceId = audienceId;
    this.tags = tags;
    this.limit = limit;
    this.segment = segment;
    this.label = label;
    this.title = title;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StepTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"step template"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round(this.quantity * this.createdAt * 100) / 100;
  }

  copy(): StepTemplate {
    return new StepTemplate(
      this.code,
      this.name,
      this.unit,
      this.createdAt,
      this.audienceId,
      this.tags,
      this.limit,
      this.segment,
      this.label,
      this.title,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a step template in status planned. */
export function newStepTemplate(code: string, name: string): StepTemplate {
  return new StepTemplate(code, name, "", 0, "", [], 0, "", "", "", 0, "planned");
}
