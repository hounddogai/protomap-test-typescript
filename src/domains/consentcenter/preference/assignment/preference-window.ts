import * as text from "../../../../kit/text.js";

/** Where a preference window is in its life cycle. */
export type PreferenceWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a preference window and its current status. */
export class PreferenceWindow {
  code: string;
  label: string;
  startsAt: number;
  phone: string;
  version: number;
  status: PreferenceWindowStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    phone: string,
    version: number,
    status: PreferenceWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.phone = phone;
    this.version = version;
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

  canMoveTo(next: PreferenceWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PreferenceWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"preference window"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.startsAt - this.version) * 100) / 100;
  }

  copy(): PreferenceWindow {
    return new PreferenceWindow(this.code, this.label, this.startsAt, this.phone, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a preference window in status draft. */
export function newPreferenceWindow(code: string, label: string): PreferenceWindow {
  return new PreferenceWindow(code, label, 0, "", 0, "draft");
}
