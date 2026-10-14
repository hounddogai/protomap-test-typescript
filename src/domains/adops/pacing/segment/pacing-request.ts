import * as text from "../../../../kit/text.js";

/** Where a pacing request is in its life cycle. */
export type PacingRequestStatus = "created" | "validated" | "published" | "retired";

/** A pacing request as the pacing team keeps it. */
export class PacingRequest {
  code: string;
  label: string;
  cost: number;
  batchSize: number;
  sequence: number;
  impressions: number;
  score: number;
  windowDays: number;
  locale: string;
  status: PacingRequestStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    batchSize: number,
    sequence: number,
    impressions: number,
    score: number,
    windowDays: number,
    locale: string,
    status: PacingRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.batchSize = batchSize;
    this.sequence = sequence;
    this.impressions = impressions;
    this.score = score;
    this.windowDays = windowDays;
    this.locale = locale;
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

  canMoveTo(next: PacingRequestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PacingRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.batchSize * this.sequence * 100) / 100;
  }

  copy(): PacingRequest {
    return new PacingRequest(
      this.code,
      this.label,
      this.cost,
      this.batchSize,
      this.sequence,
      this.impressions,
      this.score,
      this.windowDays,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pacing request in status created. */
export function newPacingRequest(code: string, label: string): PacingRequest {
  return new PacingRequest(code, label, 0, 0, 0, 0, 0, 0, "", "created");
}
