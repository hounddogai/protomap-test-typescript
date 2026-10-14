import * as text from "../../../../kit/text.js";

/** Where a wait exception is in its life cycle. */
export type WaitExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One wait exception, with what the planners need to act on it. */
export class WaitException {
  code: string;
  title: string;
  cost: number;
  updatedAt: number;
  phone: string;
  sendAt: number;
  status: WaitExceptionStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    updatedAt: number,
    phone: string,
    sendAt: number,
    status: WaitExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.updatedAt = updatedAt;
    this.phone = phone;
    this.sendAt = sendAt;
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

  canMoveTo(next: WaitExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WaitExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.updatedAt + this.sendAt) * 100) / 100;
  }

  copy(): WaitException {
    return new WaitException(this.code, this.title, this.cost, this.updatedAt, this.phone, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait exception in status idle. */
export function newWaitException(code: string, title: string): WaitException {
  return new WaitException(code, title, 0, 0, "", 0, "idle");
}
