/**
 * The mention assignment records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention assignment is in its life cycle. */
export type MentionAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A mention assignment. Its code is unique within a tenant. */
export class MentionAssignment {
  code: string;
  label: string;
  reviewer: string;
  region: string;
  currency: string;
  quantity: number;
  status: MentionAssignmentStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    region: string,
    currency: string,
    quantity: number,
    status: MentionAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.region = region;
    this.currency = currency;
    this.quantity = quantity;
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

  canMoveTo(next: MentionAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
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

  moveTo(next: MentionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"mention assignment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): MentionAssignment {
    return new MentionAssignment(
      this.code,
      this.label,
      this.reviewer,
      this.region,
      this.currency,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a mention assignment in status new. */
export function newMentionAssignment(code: string, label: string): MentionAssignment {
  return new MentionAssignment(code, label, "", "", "", 0, "new");
}
