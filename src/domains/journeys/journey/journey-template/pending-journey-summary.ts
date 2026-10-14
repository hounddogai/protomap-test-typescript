import * as text from "../../../../kit/text.js";

/** Where a pending journey summary is in its life cycle. */
export type PendingJourneySummaryStatus = "created" | "validated" | "published" | "retired";

/** The record of a pending journey summary and its current status. */
export class PendingJourneySummary {
  code: string;
  name: string;
  externalRef: string;
  channel: string;
  conversionRate: number;
  status: PendingJourneySummaryStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    channel: string,
    conversionRate: number,
    status: PendingJourneySummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.channel = channel;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: PendingJourneySummaryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingJourneySummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending journey summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending journey summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): PendingJourneySummary {
    return new PendingJourneySummary(
      this.code,
      this.name,
      this.externalRef,
      this.channel,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending journey summary in status created. */
export function newPendingJourneySummary(code: string, name: string): PendingJourneySummary {
  return new PendingJourneySummary(code, name, "", "", 0, "created");
}
