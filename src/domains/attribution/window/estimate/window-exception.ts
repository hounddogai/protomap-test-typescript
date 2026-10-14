import * as text from "../../../../kit/text.js";

/** Where a window exception is in its life cycle. */
export type WindowExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** A window exception as the window team keeps it. */
export class WindowException {
  code: string;
  name: string;
  locale: string;
  minimum: number;
  startsAt: number;
  ownerId: string;
  status: WindowExceptionStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    minimum: number,
    startsAt: number,
    ownerId: string,
    status: WindowExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.ownerId = ownerId;
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

  canMoveTo(next: WindowExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"window exception"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.startsAt - this.minimum) * 100) / 100;
  }

  copy(): WindowException {
    return new WindowException(
      this.code,
      this.name,
      this.locale,
      this.minimum,
      this.startsAt,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a window exception in status requested. */
export function newWindowException(code: string, name: string): WindowException {
  return new WindowException(code, name, "", 0, 0, "", "requested");
}
