import * as text from "../../../../kit/text.js";

/** Where a manual payout window is in its life cycle. */
export type ManualPayoutWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual payout window as the payout team keeps it. */
export class ManualPayoutWindow {
  code: string;
  label: string;
  bid: number;
  description: string;
  archived: boolean;
  ratio: number;
  status: ManualPayoutWindowStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    description: string,
    archived: boolean,
    ratio: number,
    status: ManualPayoutWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.description = description;
    this.archived = archived;
    this.ratio = ratio;
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

  canMoveTo(next: ManualPayoutWindowStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: ManualPayoutWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual payout window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual payout window"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.ratio * this.bid * 100) / 100;
  }

  copy(): ManualPayoutWindow {
    return new ManualPayoutWindow(
      this.code,
      this.label,
      this.bid,
      this.description,
      this.archived,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual payout window in status new. */
export function newManualPayoutWindow(code: string, label: string): ManualPayoutWindow {
  return new ManualPayoutWindow(code, label, 0, "", false, 0, "new");
}
