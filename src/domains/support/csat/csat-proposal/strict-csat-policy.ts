import * as text from "../../../../kit/text.js";

/** Where a strict csat policy is in its life cycle. */
export type StrictCsatPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict csat policy as the csat team keeps it. */
export class StrictCsatPolicy {
  code: string;
  label: string;
  sequence: number;
  notes: string;
  revision: number;
  discount: number;
  pinned: boolean;
  segment: string;
  approved: boolean;
  updatedAt: number;
  status: StrictCsatPolicyStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    notes: string,
    revision: number,
    discount: number,
    pinned: boolean,
    segment: string,
    approved: boolean,
    updatedAt: number,
    status: StrictCsatPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.notes = notes;
    this.revision = revision;
    this.discount = discount;
    this.pinned = pinned;
    this.segment = segment;
    this.approved = approved;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictCsatPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictCsatPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict csat policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round(this.discount * this.revision * 100) / 100;
  }

  copy(): StrictCsatPolicy {
    return new StrictCsatPolicy(
      this.code,
      this.label,
      this.sequence,
      this.notes,
      this.revision,
      this.discount,
      this.pinned,
      this.segment,
      this.approved,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict csat policy in status idle. */
export function newStrictCsatPolicy(code: string, label: string): StrictCsatPolicy {
  return new StrictCsatPolicy(code, label, 0, "", 0, 0, false, "", false, 0, "idle");
}
