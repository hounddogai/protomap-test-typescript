/**
 * The pending step digest records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending step digest is in its life cycle. */
export type PendingStepDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pending step digest as the step team keeps it. */
export class PendingStepDigest {
  code: string;
  name: string;
  visible: boolean;
  bid: number;
  audienceId: string;
  openRate: number;
  status: PendingStepDigestStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    bid: number,
    audienceId: string,
    openRate: number,
    status: PendingStepDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.bid = bid;
    this.audienceId = audienceId;
    this.openRate = openRate;
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

  canMoveTo(next: PendingStepDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
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

  moveTo(next: PendingStepDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending step digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.openRate + this.bid) * 100) / 100;
  }

  copy(): PendingStepDigest {
    return new PendingStepDigest(
      this.code,
      this.name,
      this.visible,
      this.bid,
      this.audienceId,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending step digest in status planned. */
export function newPendingStepDigest(code: string, name: string): PendingStepDigest {
  return new PendingStepDigest(code, name, false, 0, "", 0, "planned");
}
