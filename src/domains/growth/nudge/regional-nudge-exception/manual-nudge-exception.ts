/**
 * The manual nudge exception records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual nudge exception is in its life cycle. */
export type ManualNudgeExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One manual nudge exception, with what the planners need to act on it. */
export class ManualNudgeException {
  code: string;
  name: string;
  archived: boolean;
  ownerId: string;
  frequencyCap: number;
  batchSize: number;
  status: ManualNudgeExceptionStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    ownerId: string,
    frequencyCap: number,
    batchSize: number,
    status: ManualNudgeExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.ownerId = ownerId;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualNudgeExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualNudgeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual nudge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual nudge exception"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.batchSize - this.frequencyCap) * 100) / 100;
  }

  copy(): ManualNudgeException {
    return new ManualNudgeException(
      this.code,
      this.name,
      this.archived,
      this.ownerId,
      this.frequencyCap,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual nudge exception in status proposed. */
export function newManualNudgeException(code: string, name: string): ManualNudgeException {
  return new ManualNudgeException(code, name, false, "", 0, 0, "proposed");
}
