import * as text from "../../../../kit/text.js";

/** Where a default sender checkpoint is in its life cycle. */
export type DefaultSenderCheckpointStatus = "created" | "validated" | "published" | "retired";

/** One default sender checkpoint, with what the planners need to act on it. */
export class DefaultSenderCheckpoint {
  code: string;
  title: string;
  phone: string;
  active: boolean;
  bid: number;
  durationMinutes: number;
  capacity: number;
  budget: number;
  approved: boolean;
  journeyId: string;
  status: DefaultSenderCheckpointStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    active: boolean,
    bid: number,
    durationMinutes: number,
    capacity: number,
    budget: number,
    approved: boolean,
    journeyId: string,
    status: DefaultSenderCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.active = active;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.capacity = capacity;
    this.budget = budget;
    this.approved = approved;
    this.journeyId = journeyId;
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

  canMoveTo(next: DefaultSenderCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultSenderCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sender checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default sender checkpoint"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.capacity + this.durationMinutes) * 100) / 100;
  }

  copy(): DefaultSenderCheckpoint {
    return new DefaultSenderCheckpoint(
      this.code,
      this.title,
      this.phone,
      this.active,
      this.bid,
      this.durationMinutes,
      this.capacity,
      this.budget,
      this.approved,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default sender checkpoint in status created. */
export function newDefaultSenderCheckpoint(code: string, title: string): DefaultSenderCheckpoint {
  return new DefaultSenderCheckpoint(code, title, "", false, 0, 0, 0, 0, false, "", "created");
}
