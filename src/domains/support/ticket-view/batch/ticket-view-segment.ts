import * as text from "../../../../kit/text.js";

/** Where a ticket view segment is in its life cycle. */
export type TicketViewSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A ticket view segment as the ticket view team keeps it. */
export class TicketViewSegment {
  code: string;
  label: string;
  cost: number;
  batchSize: number;
  conversionRate: number;
  frequencyCap: number;
  summary: string;
  category: string;
  sequence: number;
  source: string;
  status: TicketViewSegmentStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    batchSize: number,
    conversionRate: number,
    frequencyCap: number,
    summary: string,
    category: string,
    sequence: number,
    source: string,
    status: TicketViewSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.batchSize = batchSize;
    this.conversionRate = conversionRate;
    this.frequencyCap = frequencyCap;
    this.summary = summary;
    this.category = category;
    this.sequence = sequence;
    this.source = source;
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

  canMoveTo(next: TicketViewSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TicketViewSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.sequence + this.cost) * 100) / 100;
  }

  copy(): TicketViewSegment {
    return new TicketViewSegment(
      this.code,
      this.label,
      this.cost,
      this.batchSize,
      this.conversionRate,
      this.frequencyCap,
      this.summary,
      this.category,
      this.sequence,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a ticket view segment in status requested. */
export function newTicketViewSegment(code: string, label: string): TicketViewSegment {
  return new TicketViewSegment(code, label, 0, 0, 0, 0, "", "", 0, "", "requested");
}
