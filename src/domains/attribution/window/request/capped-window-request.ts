/**
 * The capped window request records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped window request is in its life cycle. */
export type CappedWindowRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a capped window request and its current status. */
export class CappedWindowRequest {
  code: string;
  title: string;
  audienceId: string;
  approved: boolean;
  notes: string;
  sequence: number;
  status: CappedWindowRequestStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    approved: boolean,
    notes: string,
    sequence: number,
    status: CappedWindowRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.approved = approved;
    this.notes = notes;
    this.sequence = sequence;
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

  canMoveTo(next: CappedWindowRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedWindowRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped window request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped window request"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): CappedWindowRequest {
    return new CappedWindowRequest(
      this.code,
      this.title,
      this.audienceId,
      this.approved,
      this.notes,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped window request in status planned. */
export function newCappedWindowRequest(code: string, title: string): CappedWindowRequest {
  return new CappedWindowRequest(code, title, "", false, "", 0, "planned");
}
