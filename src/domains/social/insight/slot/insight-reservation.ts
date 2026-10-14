import * as text from "../../../../kit/text.js";

/** Where a insight reservation is in its life cycle. */
export type InsightReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A insight reservation as the insight team keeps it. */
export class InsightReservation {
  code: string;
  title: string;
  timezone: string;
  budget: number;
  source: string;
  sendAt: number;
  utmSource: string;
  expiresAt: number;
  checksum: string;
  sequence: number;
  status: InsightReservationStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    budget: number,
    source: string,
    sendAt: number,
    utmSource: string,
    expiresAt: number,
    checksum: string,
    sequence: number,
    status: InsightReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.budget = budget;
    this.source = source;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.sequence = sequence;
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

  canMoveTo(next: InsightReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: InsightReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.budget - this.expiresAt) * 100) / 100;
  }

  copy(): InsightReservation {
    return new InsightReservation(
      this.code,
      this.title,
      this.timezone,
      this.budget,
      this.source,
      this.sendAt,
      this.utmSource,
      this.expiresAt,
      this.checksum,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a insight reservation in status proposed. */
export function newInsightReservation(code: string, title: string): InsightReservation {
  return new InsightReservation(code, title, "", 0, "", 0, "", 0, "", 0, "proposed");
}
