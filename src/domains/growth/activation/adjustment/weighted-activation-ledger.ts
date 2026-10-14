import * as text from "../../../../kit/text.js";

/** Where a weighted activation ledger is in its life cycle. */
export type WeightedActivationLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted activation ledger as the activation team keeps it. */
export class WeightedActivationLedger {
  code: string;
  title: string;
  margin: number;
  channel: string;
  impressions: number;
  archived: boolean;
  status: WeightedActivationLedgerStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    channel: string,
    impressions: number,
    archived: boolean,
    status: WeightedActivationLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.channel = channel;
    this.impressions = impressions;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedActivationLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedActivationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted activation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round(this.impressions * this.margin * 100) / 100;
  }

  copy(): WeightedActivationLedger {
    return new WeightedActivationLedger(
      this.code,
      this.title,
      this.margin,
      this.channel,
      this.impressions,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted activation ledger in status open. */
export function newWeightedActivationLedger(code: string, title: string): WeightedActivationLedger {
  return new WeightedActivationLedger(code, title, 0, "", 0, false, "open");
}
