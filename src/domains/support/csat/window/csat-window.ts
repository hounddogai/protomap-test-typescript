/**
 * The csat window records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat window is in its life cycle. */
export type CsatWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One csat window, with what the planners need to act on it. */
export class CsatWindow {
  code: string;
  name: string;
  version: number;
  sendAt: number;
  conversionRate: number;
  locale: string;
  quantity: number;
  status: CsatWindowStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    sendAt: number,
    conversionRate: number,
    locale: string,
    quantity: number,
    status: CsatWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.sendAt = sendAt;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"csat window"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.quantity - this.version) * 100) / 100;
  }

  copy(): CsatWindow {
    return new CsatWindow(
      this.code,
      this.name,
      this.version,
      this.sendAt,
      this.conversionRate,
      this.locale,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a csat window in status proposed. */
export function newCsatWindow(code: string, name: string): CsatWindow {
  return new CsatWindow(code, name, 0, 0, 0, "", 0, "proposed");
}
