import * as text from "../../../../kit/text.js";

/** Where a scheduled retention cycle is in its life cycle. */
export type ScheduledRetentionCycleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled retention cycle. Its code is unique within a tenant. */
export class ScheduledRetentionCycle {
  code: string;
  label: string;
  retries: number;
  archived: boolean;
  campaignRef: string;
  ownerId: string;
  status: ScheduledRetentionCycleStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    archived: boolean,
    campaignRef: string,
    ownerId: string,
    status: ScheduledRetentionCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
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

  canMoveTo(next: ScheduledRetentionCycleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledRetentionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled retention cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): ScheduledRetentionCycle {
    return new ScheduledRetentionCycle(
      this.code,
      this.label,
      this.retries,
      this.archived,
      this.campaignRef,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled retention cycle in status open. */
export function newScheduledRetentionCycle(code: string, label: string): ScheduledRetentionCycle {
  return new ScheduledRetentionCycle(code, label, 0, false, "", "", "open");
}
