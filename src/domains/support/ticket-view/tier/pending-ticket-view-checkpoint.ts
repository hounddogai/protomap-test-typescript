import * as text from "../../../../kit/text.js";

/** Where a pending ticket view checkpoint is in its life cycle. */
export type PendingTicketViewCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One pending ticket view checkpoint, with what the planners need to act on it. */
export class PendingTicketViewCheckpoint {
  code: string;
  label: string;
  amount: number;
  ratio: number;
  clicks: number;
  rate: number;
  locale: string;
  phone: string;
  status: PendingTicketViewCheckpointStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    ratio: number,
    clicks: number,
    rate: number,
    locale: string,
    phone: string,
    status: PendingTicketViewCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.ratio = ratio;
    this.clicks = clicks;
    this.rate = rate;
    this.locale = locale;
    this.phone = phone;
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

  canMoveTo(next: PendingTicketViewCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingTicketViewCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending ticket view checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.amount - this.rate) * 100) / 100;
  }

  copy(): PendingTicketViewCheckpoint {
    return new PendingTicketViewCheckpoint(
      this.code,
      this.label,
      this.amount,
      this.ratio,
      this.clicks,
      this.rate,
      this.locale,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending ticket view checkpoint in status draft. */
export function newPendingTicketViewCheckpoint(code: string, label: string): PendingTicketViewCheckpoint {
  return new PendingTicketViewCheckpoint(code, label, 0, 0, 0, 0, "", "", "draft");
}
