import * as text from "../../../../kit/text.js";

/** Where a pacing exception is in its life cycle. */
export type PacingExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pacing exception and its current status. */
export class PacingException {
  code: string;
  title: string;
  retries: number;
  margin: number;
  active: boolean;
  capacity: number;
  threshold: number;
  status: PacingExceptionStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    margin: number,
    active: boolean,
    capacity: number,
    threshold: number,
    status: PacingExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.margin = margin;
    this.active = active;
    this.capacity = capacity;
    this.threshold = threshold;
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

  canMoveTo(next: PacingExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
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

  moveTo(next: PacingExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.retries + this.threshold) * 100) / 100;
  }

  copy(): PacingException {
    return new PacingException(
      this.code,
      this.title,
      this.retries,
      this.margin,
      this.active,
      this.capacity,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pacing exception in status draft. */
export function newPacingException(code: string, title: string): PacingException {
  return new PacingException(code, title, 0, 0, false, 0, 0, "draft");
}
