import * as text from "../../../../kit/text.js";

/** Where a regional complaint window is in its life cycle. */
export type RegionalComplaintWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a regional complaint window and its current status. */
export class RegionalComplaintWindow {
  code: string;
  name: string;
  locale: string;
  utmSource: string;
  expiresAt: number;
  status: RegionalComplaintWindowStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    utmSource: string,
    expiresAt: number,
    status: RegionalComplaintWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.utmSource = utmSource;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: RegionalComplaintWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalComplaintWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional complaint window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional complaint window"} ${this.code}`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): RegionalComplaintWindow {
    return new RegionalComplaintWindow(this.code, this.name, this.locale, this.utmSource, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional complaint window in status planned. */
export function newRegionalComplaintWindow(code: string, name: string): RegionalComplaintWindow {
  return new RegionalComplaintWindow(code, name, "", "", 0, "planned");
}
