import * as text from "../../../../kit/text.js";

/** Where a ticket view estimate is in its life cycle. */
export type TicketViewEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A ticket view estimate as the ticket view team keeps it. */
export class TicketViewEstimate {
  code: string;
  name: string;
  endsAt: number;
  budget: number;
  expiresAt: number;
  tags: string[];
  ratio: number;
  summary: string;
  ceiling: number;
  sequence: number;
  sendAt: number;
  status: TicketViewEstimateStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    budget: number,
    expiresAt: number,
    tags: string[],
    ratio: number,
    summary: string,
    ceiling: number,
    sequence: number,
    sendAt: number,
    status: TicketViewEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.tags = tags;
    this.ratio = ratio;
    this.summary = summary;
    this.ceiling = ceiling;
    this.sequence = sequence;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"ticket view estimate"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.ceiling - this.budget) * 100) / 100;
  }

  copy(): TicketViewEstimate {
    return new TicketViewEstimate(
      this.code,
      this.name,
      this.endsAt,
      this.budget,
      this.expiresAt,
      this.tags,
      this.ratio,
      this.summary,
      this.ceiling,
      this.sequence,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a ticket view estimate in status new. */
export function newTicketViewEstimate(code: string, name: string): TicketViewEstimate {
  return new TicketViewEstimate(code, name, 0, 0, 0, [], 0, "", 0, 0, 0, "new");
}
