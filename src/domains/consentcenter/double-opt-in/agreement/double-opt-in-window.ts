import * as text from "../../../../kit/text.js";

/** Where a double opt in window is in its life cycle. */
export type DoubleOptInWindowStatus = "created" | "validated" | "published" | "retired";

/** A double opt in window as the double opt in team keeps it. */
export class DoubleOptInWindow {
  code: string;
  title: string;
  campaignRef: string;
  version: number;
  windowDays: number;
  status: DoubleOptInWindowStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    version: number,
    windowDays: number,
    status: DoubleOptInWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.version = version;
    this.windowDays = windowDays;
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

  canMoveTo(next: DoubleOptInWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round(this.windowDays * this.version * 100) / 100;
  }

  copy(): DoubleOptInWindow {
    return new DoubleOptInWindow(this.code, this.title, this.campaignRef, this.version, this.windowDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a double opt in window in status created. */
export function newDoubleOptInWindow(code: string, title: string): DoubleOptInWindow {
  return new DoubleOptInWindow(code, title, "", 0, 0, "created");
}
