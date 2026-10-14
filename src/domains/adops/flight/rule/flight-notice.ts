import * as text from "../../../../kit/text.js";

/** Where a flight notice is in its life cycle. */
export type FlightNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** A flight notice. Its code is unique within a tenant. */
export class FlightNotice {
  code: string;
  name: string;
  score: number;
  capacity: number;
  threshold: number;
  phone: string;
  unit: string;
  revision: number;
  status: FlightNoticeStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    capacity: number,
    threshold: number,
    phone: string,
    unit: string,
    revision: number,
    status: FlightNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.capacity = capacity;
    this.threshold = threshold;
    this.phone = phone;
    this.unit = unit;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.score - this.revision) * 100) / 100;
  }

  copy(): FlightNotice {
    return new FlightNotice(
      this.code,
      this.name,
      this.score,
      this.capacity,
      this.threshold,
      this.phone,
      this.unit,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a flight notice in status requested. */
export function newFlightNotice(code: string, name: string): FlightNotice {
  return new FlightNotice(code, name, 0, 0, 0, "", "", 0, "requested");
}
