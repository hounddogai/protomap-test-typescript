import * as text from "../../../../kit/text.js";

/** Where a strict double opt in exception is in its life cycle. */
export type StrictDoubleOptInExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a strict double opt in exception and its current status. */
export class StrictDoubleOptInException {
  code: string;
  title: string;
  channel: string;
  sendAt: number;
  limit: number;
  externalRef: string;
  revision: number;
  status: StrictDoubleOptInExceptionStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    sendAt: number,
    limit: number,
    externalRef: string,
    revision: number,
    status: StrictDoubleOptInExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.sendAt = sendAt;
    this.limit = limit;
    this.externalRef = externalRef;
    this.revision = revision;
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

  canMoveTo(next: StrictDoubleOptInExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictDoubleOptInExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict double opt in exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"strict double opt in exception"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.limit + this.revision) * 100) / 100;
  }

  copy(): StrictDoubleOptInException {
    return new StrictDoubleOptInException(
      this.code,
      this.title,
      this.channel,
      this.sendAt,
      this.limit,
      this.externalRef,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict double opt in exception in status idle. */
export function newStrictDoubleOptInException(code: string, title: string): StrictDoubleOptInException {
  return new StrictDoubleOptInException(code, title, "", 0, 0, "", 0, "idle");
}
