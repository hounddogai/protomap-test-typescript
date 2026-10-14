import * as text from "../../../../kit/text.js";

/** Where a rolling wait window is in its life cycle. */
export type RollingWaitWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One rolling wait window, with what the planners need to act on it. */
export class RollingWaitWindow {
  code: string;
  label: string;
  phone: string;
  externalRef: string;
  ratio: number;
  windowDays: number;
  margin: number;
  impressions: number;
  ownerId: string;
  status: RollingWaitWindowStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    externalRef: string,
    ratio: number,
    windowDays: number,
    margin: number,
    impressions: number,
    ownerId: string,
    status: RollingWaitWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.windowDays = windowDays;
    this.margin = margin;
    this.impressions = impressions;
    this.ownerId = ownerId;
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

  canMoveTo(next: RollingWaitWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
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

  moveTo(next: RollingWaitWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling wait window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.windowDays - this.ratio) * 100) / 100;
  }

  copy(): RollingWaitWindow {
    return new RollingWaitWindow(
      this.code,
      this.label,
      this.phone,
      this.externalRef,
      this.ratio,
      this.windowDays,
      this.margin,
      this.impressions,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling wait window in status draft. */
export function newRollingWaitWindow(code: string, label: string): RollingWaitWindow {
  return new RollingWaitWindow(code, label, "", "", 0, 0, 0, 0, "", "draft");
}
