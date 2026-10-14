import * as text from "../../../../kit/text.js";

/** Where a placement exception is in its life cycle. */
export type PlacementExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One placement exception, with what the planners need to act on it. */
export class PlacementException {
  code: string;
  label: string;
  rate: number;
  sendAt: number;
  margin: number;
  durationMinutes: number;
  status: PlacementExceptionStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    sendAt: number,
    margin: number,
    durationMinutes: number,
    status: PlacementExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.sendAt = sendAt;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: PlacementExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PlacementExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"placement exception"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.margin + this.rate) * 100) / 100;
  }

  copy(): PlacementException {
    return new PlacementException(
      this.code,
      this.label,
      this.rate,
      this.sendAt,
      this.margin,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a placement exception in status draft. */
export function newPlacementException(code: string, label: string): PlacementException {
  return new PlacementException(code, label, 0, 0, 0, 0, "draft");
}
