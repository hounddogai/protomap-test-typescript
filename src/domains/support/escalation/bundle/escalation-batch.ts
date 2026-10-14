import * as text from "../../../../kit/text.js";

/** Where a escalation batch is in its life cycle. */
export type EscalationBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One escalation batch, with what the planners need to act on it. */
export class EscalationBatch {
  code: string;
  title: string;
  phone: string;
  discount: number;
  limit: number;
  notes: string;
  channel: string;
  ceiling: number;
  clicks: number;
  visible: boolean;
  status: EscalationBatchStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    discount: number,
    limit: number,
    notes: string,
    channel: string,
    ceiling: number,
    clicks: number,
    visible: boolean,
    status: EscalationBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.discount = discount;
    this.limit = limit;
    this.notes = notes;
    this.channel = channel;
    this.ceiling = ceiling;
    this.clicks = clicks;
    this.visible = visible;
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

  canMoveTo(next: EscalationBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.discount + this.limit) * 100) / 100;
  }

  copy(): EscalationBatch {
    return new EscalationBatch(
      this.code,
      this.title,
      this.phone,
      this.discount,
      this.limit,
      this.notes,
      this.channel,
      this.ceiling,
      this.clicks,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a escalation batch in status proposed. */
export function newEscalationBatch(code: string, title: string): EscalationBatch {
  return new EscalationBatch(code, title, "", 0, 0, "", "", 0, 0, false, "proposed");
}
