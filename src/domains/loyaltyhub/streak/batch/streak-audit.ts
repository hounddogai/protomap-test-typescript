import * as text from "../../../../kit/text.js";

/** Where a streak audit is in its life cycle. */
export type StreakAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A streak audit. Its code is unique within a tenant. */
export class StreakAudit {
  code: string;
  label: string;
  ratio: number;
  active: boolean;
  archived: boolean;
  segment: string;
  title: string;
  floorValue: number;
  status: StreakAuditStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    active: boolean,
    archived: boolean,
    segment: string,
    title: string,
    floorValue: number,
    status: StreakAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.active = active;
    this.archived = archived;
    this.segment = segment;
    this.title = title;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakAuditStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StreakAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round(this.floorValue * this.ratio * 100) / 100;
  }

  copy(): StreakAudit {
    return new StreakAudit(
      this.code,
      this.label,
      this.ratio,
      this.active,
      this.archived,
      this.segment,
      this.title,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a streak audit in status open. */
export function newStreakAudit(code: string, label: string): StreakAudit {
  return new StreakAudit(code, label, 0, false, false, "", "", 0, "open");
}
