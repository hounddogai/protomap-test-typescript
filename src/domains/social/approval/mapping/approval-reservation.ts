import * as text from "../../../../kit/text.js";

/** Where a approval reservation is in its life cycle. */
export type ApprovalReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One approval reservation, with what the planners need to act on it. */
export class ApprovalReservation {
  code: string;
  title: string;
  version: number;
  utmSource: string;
  source: string;
  status: ApprovalReservationStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    utmSource: string,
    source: string,
    status: ApprovalReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.utmSource = utmSource;
    this.source = source;
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

  canMoveTo(next: ApprovalReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: ApprovalReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): ApprovalReservation {
    return new ApprovalReservation(this.code, this.title, this.version, this.utmSource, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a approval reservation in status idle. */
export function newApprovalReservation(code: string, title: string): ApprovalReservation {
  return new ApprovalReservation(code, title, 0, "", "", "idle");
}
