import * as text from "../../../../kit/text.js";

/** Where a rolling bid rule batch is in its life cycle. */
export type RollingBidRuleBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling bid rule batch. Its code is unique within a tenant. */
export class RollingBidRuleBatch {
  code: string;
  title: string;
  region: string;
  sequence: number;
  maximum: number;
  limit: number;
  ownerId: string;
  status: RollingBidRuleBatchStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    sequence: number,
    maximum: number,
    limit: number,
    ownerId: string,
    status: RollingBidRuleBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.sequence = sequence;
    this.maximum = maximum;
    this.limit = limit;
    this.ownerId = ownerId;
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

  canMoveTo(next: RollingBidRuleBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingBidRuleBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling bid rule batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling bid rule batch"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.maximum * this.sequence * 100) / 100;
  }

  copy(): RollingBidRuleBatch {
    return new RollingBidRuleBatch(
      this.code,
      this.title,
      this.region,
      this.sequence,
      this.maximum,
      this.limit,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling bid rule batch in status proposed. */
export function newRollingBidRuleBatch(code: string, title: string): RollingBidRuleBatch {
  return new RollingBidRuleBatch(code, title, "", 0, 0, 0, "", "proposed");
}
