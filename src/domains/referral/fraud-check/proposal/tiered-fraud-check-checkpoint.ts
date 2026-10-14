import * as text from "../../../../kit/text.js";

/** Where a tiered fraud check checkpoint is in its life cycle. */
export type TieredFraudCheckCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A tiered fraud check checkpoint as the fraud check team keeps it. */
export class TieredFraudCheckCheckpoint {
  code: string;
  name: string;
  minimum: number;
  sendAt: number;
  bid: number;
  segment: string;
  amount: number;
  visible: boolean;
  status: TieredFraudCheckCheckpointStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    sendAt: number,
    bid: number,
    segment: string,
    amount: number,
    visible: boolean,
    status: TieredFraudCheckCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.sendAt = sendAt;
    this.bid = bid;
    this.segment = segment;
    this.amount = amount;
    this.visible = visible;
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

  canMoveTo(next: TieredFraudCheckCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
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

  moveTo(next: TieredFraudCheckCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered fraud check checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered fraud check checkpoint"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.amount + this.sendAt) * 100) / 100;
  }

  copy(): TieredFraudCheckCheckpoint {
    return new TieredFraudCheckCheckpoint(
      this.code,
      this.name,
      this.minimum,
      this.sendAt,
      this.bid,
      this.segment,
      this.amount,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered fraud check checkpoint in status created. */
export function newTieredFraudCheckCheckpoint(code: string, name: string): TieredFraudCheckCheckpoint {
  return new TieredFraudCheckCheckpoint(code, name, 0, 0, 0, "", 0, false, "created");
}
