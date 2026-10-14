import * as text from "../../../../kit/text.js";

/** Where a post reservation is in its life cycle. */
export type PostReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a post reservation and its current status. */
export class PostReservation {
  code: string;
  title: string;
  visible: boolean;
  windowDays: number;
  capacity: number;
  status: PostReservationStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    windowDays: number,
    capacity: number,
    status: PostReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.windowDays = windowDays;
    this.capacity = capacity;
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

  canMoveTo(next: PostReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
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

  moveTo(next: PostReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round(this.windowDays * this.capacity * 100) / 100;
  }

  copy(): PostReservation {
    return new PostReservation(this.code, this.title, this.visible, this.windowDays, this.capacity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a post reservation in status planned. */
export function newPostReservation(code: string, title: string): PostReservation {
  return new PostReservation(code, title, false, 0, 0, "planned");
}
