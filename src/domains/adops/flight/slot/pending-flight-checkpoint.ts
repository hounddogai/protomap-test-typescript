import * as text from "../../../../kit/text.js";

/** Where a pending flight checkpoint is in its life cycle. */
export type PendingFlightCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending flight checkpoint, with what the planners need to act on it. */
export class PendingFlightCheckpoint {
  code: string;
  title: string;
  active: boolean;
  pinned: boolean;
  capacity: number;
  category: string;
  expiresAt: number;
  endsAt: number;
  ratio: number;
  retries: number;
  description: string;
  status: PendingFlightCheckpointStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    pinned: boolean,
    capacity: number,
    category: string,
    expiresAt: number,
    endsAt: number,
    ratio: number,
    retries: number,
    description: string,
    status: PendingFlightCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.pinned = pinned;
    this.capacity = capacity;
    this.category = category;
    this.expiresAt = expiresAt;
    this.endsAt = endsAt;
    this.ratio = ratio;
    this.retries = retries;
    this.description = description;
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

  canMoveTo(next: PendingFlightCheckpointStatus): boolean {
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
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingFlightCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending flight checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending flight checkpoint"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.ratio + this.endsAt) * 100) / 100;
  }

  copy(): PendingFlightCheckpoint {
    return new PendingFlightCheckpoint(
      this.code,
      this.title,
      this.active,
      this.pinned,
      this.capacity,
      this.category,
      this.expiresAt,
      this.endsAt,
      this.ratio,
      this.retries,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending flight checkpoint in status idle. */
export function newPendingFlightCheckpoint(code: string, title: string): PendingFlightCheckpoint {
  return new PendingFlightCheckpoint(code, title, false, false, 0, "", 0, 0, 0, 0, "", "idle");
}
