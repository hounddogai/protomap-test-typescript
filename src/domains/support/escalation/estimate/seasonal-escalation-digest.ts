import * as text from "../../../../kit/text.js";

/** Where a seasonal escalation digest is in its life cycle. */
export type SeasonalEscalationDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a seasonal escalation digest and its current status. */
export class SeasonalEscalationDigest {
  code: string;
  name: string;
  frequencyCap: number;
  segment: string;
  discount: number;
  notes: string;
  score: number;
  sequence: number;
  bid: number;
  status: SeasonalEscalationDigestStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    segment: string,
    discount: number,
    notes: string,
    score: number,
    sequence: number,
    bid: number,
    status: SeasonalEscalationDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.discount = discount;
    this.notes = notes;
    this.score = score;
    this.sequence = sequence;
    this.bid = bid;
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

  canMoveTo(next: SeasonalEscalationDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalEscalationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal escalation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.sequence + this.discount) * 100) / 100;
  }

  copy(): SeasonalEscalationDigest {
    return new SeasonalEscalationDigest(
      this.code,
      this.name,
      this.frequencyCap,
      this.segment,
      this.discount,
      this.notes,
      this.score,
      this.sequence,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal escalation digest in status draft. */
export function newSeasonalEscalationDigest(code: string, name: string): SeasonalEscalationDigest {
  return new SeasonalEscalationDigest(code, name, 0, "", 0, "", 0, 0, 0, "draft");
}
