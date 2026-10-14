import * as text from "../../../../kit/text.js";

/** Where a weighted deflection audit is in its life cycle. */
export type WeightedDeflectionAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted deflection audit, with what the planners need to act on it. */
export class WeightedDeflectionAudit {
  code: string;
  title: string;
  batchSize: number;
  attempts: number;
  journeyId: string;
  sequence: number;
  maximum: number;
  rate: number;
  endsAt: number;
  clicks: number;
  description: string;
  status: WeightedDeflectionAuditStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    attempts: number,
    journeyId: string,
    sequence: number,
    maximum: number,
    rate: number,
    endsAt: number,
    clicks: number,
    description: string,
    status: WeightedDeflectionAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.attempts = attempts;
    this.journeyId = journeyId;
    this.sequence = sequence;
    this.maximum = maximum;
    this.rate = rate;
    this.endsAt = endsAt;
    this.clicks = clicks;
    this.description = description;
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

  canMoveTo(next: WeightedDeflectionAuditStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedDeflectionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted deflection audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.rate - this.batchSize) * 100) / 100;
  }

  copy(): WeightedDeflectionAudit {
    return new WeightedDeflectionAudit(
      this.code,
      this.title,
      this.batchSize,
      this.attempts,
      this.journeyId,
      this.sequence,
      this.maximum,
      this.rate,
      this.endsAt,
      this.clicks,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted deflection audit in status new. */
export function newWeightedDeflectionAudit(code: string, title: string): WeightedDeflectionAudit {
  return new WeightedDeflectionAudit(code, title, 0, 0, "", 0, 0, 0, 0, 0, "", "new");
}
