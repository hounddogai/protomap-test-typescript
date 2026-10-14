/**
 * The rolling mention record records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling mention record is in its life cycle. */
export type RollingMentionRecordStatus = "created" | "validated" | "published" | "retired";

/** The record of a rolling mention record and its current status. */
export class RollingMentionRecord {
  code: string;
  name: string;
  priority: number;
  visible: boolean;
  endsAt: number;
  status: RollingMentionRecordStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    visible: boolean,
    endsAt: number,
    status: RollingMentionRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.visible = visible;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingMentionRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingMentionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling mention record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.priority - this.endsAt) * 100) / 100;
  }

  copy(): RollingMentionRecord {
    return new RollingMentionRecord(this.code, this.name, this.priority, this.visible, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling mention record in status created. */
export function newRollingMentionRecord(code: string, name: string): RollingMentionRecord {
  return new RollingMentionRecord(code, name, 0, false, 0, "created");
}
