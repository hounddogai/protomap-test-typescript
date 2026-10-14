import * as text from "../../../../kit/text.js";

/** Where a lenient post window is in its life cycle. */
export type LenientPostWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One lenient post window, with what the planners need to act on it. */
export class LenientPostWindow {
  code: string;
  label: string;
  locale: string;
  startsAt: number;
  channel: string;
  status: LenientPostWindowStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    startsAt: number,
    channel: string,
    status: LenientPostWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.startsAt = startsAt;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPostWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPostWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient post window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"lenient post window"} ${this.code}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): LenientPostWindow {
    return new LenientPostWindow(this.code, this.label, this.locale, this.startsAt, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient post window in status draft. */
export function newLenientPostWindow(code: string, label: string): LenientPostWindow {
  return new LenientPostWindow(code, label, "", 0, "", "draft");
}
