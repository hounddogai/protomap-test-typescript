import * as text from "../../../../kit/text.js";

/** Where a global creative exception is in its life cycle. */
export type GlobalCreativeExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One global creative exception, with what the planners need to act on it. */
export class GlobalCreativeException {
  code: string;
  label: string;
  visible: boolean;
  name: string;
  bid: number;
  ceiling: number;
  country: string;
  archived: boolean;
  priority: number;
  status: GlobalCreativeExceptionStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    name: string,
    bid: number,
    ceiling: number,
    country: string,
    archived: boolean,
    priority: number,
    status: GlobalCreativeExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.name = name;
    this.bid = bid;
    this.ceiling = ceiling;
    this.country = country;
    this.archived = archived;
    this.priority = priority;
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

  canMoveTo(next: GlobalCreativeExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalCreativeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global creative exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.bid * this.priority * 100) / 100;
  }

  copy(): GlobalCreativeException {
    return new GlobalCreativeException(
      this.code,
      this.label,
      this.visible,
      this.name,
      this.bid,
      this.ceiling,
      this.country,
      this.archived,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global creative exception in status idle. */
export function newGlobalCreativeException(code: string, label: string): GlobalCreativeException {
  return new GlobalCreativeException(code, label, false, "", 0, 0, "", false, 0, "idle");
}
