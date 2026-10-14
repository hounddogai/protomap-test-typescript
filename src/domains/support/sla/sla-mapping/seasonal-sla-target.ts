import * as text from "../../../../kit/text.js";

/** Where a seasonal sla target is in its life cycle. */
export type SeasonalSlaTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a seasonal sla target and its current status. */
export class SeasonalSlaTarget {
  code: string;
  title: string;
  retries: number;
  windowDays: number;
  visible: boolean;
  bid: number;
  sequence: number;
  utmSource: string;
  threshold: number;
  status: SeasonalSlaTargetStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    windowDays: number,
    visible: boolean,
    bid: number,
    sequence: number,
    utmSource: string,
    threshold: number,
    status: SeasonalSlaTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.windowDays = windowDays;
    this.visible = visible;
    this.bid = bid;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.threshold = threshold;
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

  canMoveTo(next: SeasonalSlaTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalSlaTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal sla target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.threshold - this.bid) * 100) / 100;
  }

  copy(): SeasonalSlaTarget {
    return new SeasonalSlaTarget(
      this.code,
      this.title,
      this.retries,
      this.windowDays,
      this.visible,
      this.bid,
      this.sequence,
      this.utmSource,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a seasonal sla target in status proposed. */
export function newSeasonalSlaTarget(code: string, title: string): SeasonalSlaTarget {
  return new SeasonalSlaTarget(code, title, 0, 0, false, 0, 0, "", 0, "proposed");
}
