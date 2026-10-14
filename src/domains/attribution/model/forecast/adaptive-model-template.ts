import * as text from "../../../../kit/text.js";

/** Where a adaptive model template is in its life cycle. */
export type AdaptiveModelTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a adaptive model template and its current status. */
export class AdaptiveModelTemplate {
  code: string;
  label: string;
  name: string;
  graceDays: number;
  createdAt: number;
  pinned: boolean;
  capacity: number;
  cohort: string;
  active: boolean;
  ownerId: string;
  status: AdaptiveModelTemplateStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    graceDays: number,
    createdAt: number,
    pinned: boolean,
    capacity: number,
    cohort: string,
    active: boolean,
    ownerId: string,
    status: AdaptiveModelTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.pinned = pinned;
    this.capacity = capacity;
    this.cohort = cohort;
    this.active = active;
    this.ownerId = ownerId;
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

  canMoveTo(next: AdaptiveModelTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveModelTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive model template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.capacity + this.graceDays) * 100) / 100;
  }

  copy(): AdaptiveModelTemplate {
    return new AdaptiveModelTemplate(
      this.code,
      this.label,
      this.name,
      this.graceDays,
      this.createdAt,
      this.pinned,
      this.capacity,
      this.cohort,
      this.active,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive model template in status planned. */
export function newAdaptiveModelTemplate(code: string, label: string): AdaptiveModelTemplate {
  return new AdaptiveModelTemplate(code, label, "", 0, 0, false, 0, "", false, "", "planned");
}
