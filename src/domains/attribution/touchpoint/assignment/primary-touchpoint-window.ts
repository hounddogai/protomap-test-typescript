import * as text from "../../../../kit/text.js";

/** Where a primary touchpoint window is in its life cycle. */
export type PrimaryTouchpointWindowStatus = "created" | "validated" | "published" | "retired";

/** The record of a primary touchpoint window and its current status. */
export class PrimaryTouchpointWindow {
  code: string;
  label: string;
  version: number;
  pinned: boolean;
  updatedAt: number;
  status: PrimaryTouchpointWindowStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    pinned: boolean,
    updatedAt: number,
    status: PrimaryTouchpointWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.pinned = pinned;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: PrimaryTouchpointWindowStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryTouchpointWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary touchpoint window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.version * this.updatedAt * 100) / 100;
  }

  copy(): PrimaryTouchpointWindow {
    return new PrimaryTouchpointWindow(this.code, this.label, this.version, this.pinned, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary touchpoint window in status created. */
export function newPrimaryTouchpointWindow(code: string, label: string): PrimaryTouchpointWindow {
  return new PrimaryTouchpointWindow(code, label, 0, false, 0, "created");
}
