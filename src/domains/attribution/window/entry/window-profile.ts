import * as text from "../../../../kit/text.js";

/** Where a window profile is in its life cycle. */
export type WindowProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A window profile as the window team keeps it. */
export class WindowProfile {
  code: string;
  name: string;
  priority: number;
  sendAt: number;
  retries: number;
  ceiling: number;
  utmSource: string;
  pinned: boolean;
  endsAt: number;
  status: WindowProfileStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    sendAt: number,
    retries: number,
    ceiling: number,
    utmSource: string,
    pinned: boolean,
    endsAt: number,
    status: WindowProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.sendAt = sendAt;
    this.retries = retries;
    this.ceiling = ceiling;
    this.utmSource = utmSource;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowProfileStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.endsAt + this.ceiling) * 100) / 100;
  }

  copy(): WindowProfile {
    return new WindowProfile(
      this.code,
      this.name,
      this.priority,
      this.sendAt,
      this.retries,
      this.ceiling,
      this.utmSource,
      this.pinned,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a window profile in status open. */
export function newWindowProfile(code: string, name: string): WindowProfile {
  return new WindowProfile(code, name, 0, 0, 0, 0, "", false, 0, "open");
}
