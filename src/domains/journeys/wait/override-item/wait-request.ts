import * as text from "../../../../kit/text.js";

/** Where a wait request is in its life cycle. */
export type WaitRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A wait request as the wait team keeps it. */
export class WaitRequest {
  code: string;
  title: string;
  updatedAt: number;
  segment: string;
  notes: string;
  label: string;
  attempts: number;
  capacity: number;
  status: WaitRequestStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    segment: string,
    notes: string,
    label: string,
    attempts: number,
    capacity: number,
    status: WaitRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.segment = segment;
    this.notes = notes;
    this.label = label;
    this.attempts = attempts;
    this.capacity = capacity;
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

  canMoveTo(next: WaitRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WaitRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round((this.capacity - this.attempts) * 100) / 100;
  }

  copy(): WaitRequest {
    return new WaitRequest(
      this.code,
      this.title,
      this.updatedAt,
      this.segment,
      this.notes,
      this.label,
      this.attempts,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a wait request in status idle. */
export function newWaitRequest(code: string, title: string): WaitRequest {
  return new WaitRequest(code, title, 0, "", "", "", 0, 0, "idle");
}
