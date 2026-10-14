import * as text from "../../../../kit/text.js";

/** Where a fallback insight exception is in its life cycle. */
export type FallbackInsightExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a fallback insight exception and its current status. */
export class FallbackInsightException {
  code: string;
  name: string;
  threshold: number;
  cost: number;
  audienceId: string;
  margin: number;
  pinned: boolean;
  durationMinutes: number;
  floorValue: number;
  createdAt: number;
  status: FallbackInsightExceptionStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    cost: number,
    audienceId: string,
    margin: number,
    pinned: boolean,
    durationMinutes: number,
    floorValue: number,
    createdAt: number,
    status: FallbackInsightExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.cost = cost;
    this.audienceId = audienceId;
    this.margin = margin;
    this.pinned = pinned;
    this.durationMinutes = durationMinutes;
    this.floorValue = floorValue;
    this.createdAt = createdAt;
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

  canMoveTo(next: FallbackInsightExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: FallbackInsightExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback insight exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.createdAt - this.durationMinutes) * 100) / 100;
  }

  copy(): FallbackInsightException {
    return new FallbackInsightException(
      this.code,
      this.name,
      this.threshold,
      this.cost,
      this.audienceId,
      this.margin,
      this.pinned,
      this.durationMinutes,
      this.floorValue,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback insight exception in status draft. */
export function newFallbackInsightException(code: string, name: string): FallbackInsightException {
  return new FallbackInsightException(code, name, 0, 0, "", 0, false, 0, 0, 0, "draft");
}
