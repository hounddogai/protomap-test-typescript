import * as text from "../../../../kit/text.js";

/** Where a redemption reservation is in its life cycle. */
export type RedemptionReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One redemption reservation, with what the planners need to act on it. */
export class RedemptionReservation {
  code: string;
  title: string;
  utmSource: string;
  attributes: Map<string, string>;
  attempts: number;
  status: RedemptionReservationStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    attributes: Map<string, string>,
    attempts: number,
    status: RedemptionReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.attributes = attributes;
    this.attempts = attempts;
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

  canMoveTo(next: RedemptionReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): RedemptionReservation {
    return new RedemptionReservation(
      this.code,
      this.title,
      this.utmSource,
      this.attributes,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a redemption reservation in status idle. */
export function newRedemptionReservation(code: string, title: string): RedemptionReservation {
  return new RedemptionReservation(code, title, "", new Map<string, string>(), 0, "idle");
}
