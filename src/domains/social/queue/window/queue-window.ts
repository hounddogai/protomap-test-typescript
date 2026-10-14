/**
 * The queue window records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue window is in its life cycle. */
export type QueueWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** One queue window, with what the planners need to act on it. */
export class QueueWindow {
  code: string;
  title: string;
  createdAt: number;
  attempts: number;
  revision: number;
  utmSource: string;
  capacity: number;
  phone: string;
  ratio: number;
  status: QueueWindowStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    attempts: number,
    revision: number,
    utmSource: string,
    capacity: number,
    phone: string,
    ratio: number,
    status: QueueWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.attempts = attempts;
    this.revision = revision;
    this.utmSource = utmSource;
    this.capacity = capacity;
    this.phone = phone;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.capacity + this.attempts) * 100) / 100;
  }

  copy(): QueueWindow {
    return new QueueWindow(
      this.code,
      this.title,
      this.createdAt,
      this.attempts,
      this.revision,
      this.utmSource,
      this.capacity,
      this.phone,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a queue window in status requested. */
export function newQueueWindow(code: string, title: string): QueueWindow {
  return new QueueWindow(code, title, 0, 0, 0, "", 0, "", 0, "requested");
}
