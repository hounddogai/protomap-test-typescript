import * as text from "../../../../kit/text.js";

/** Where a lenient opt out batch is in its life cycle. */
export type LenientOptOutBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One lenient opt out batch, with what the planners need to act on it. */
export class LenientOptOutBatch {
  code: string;
  label: string;
  locale: string;
  source: string;
  phone: string;
  attempts: number;
  limit: number;
  quantity: number;
  channel: string;
  contactEmail: string;
  score: number;
  status: LenientOptOutBatchStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    source: string,
    phone: string,
    attempts: number,
    limit: number,
    quantity: number,
    channel: string,
    contactEmail: string,
    score: number,
    status: LenientOptOutBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.source = source;
    this.phone = phone;
    this.attempts = attempts;
    this.limit = limit;
    this.quantity = quantity;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientOptOutBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientOptOutBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient opt out batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient opt out batch"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.quantity + this.score) * 100) / 100;
  }

  copy(): LenientOptOutBatch {
    return new LenientOptOutBatch(
      this.code,
      this.label,
      this.locale,
      this.source,
      this.phone,
      this.attempts,
      this.limit,
      this.quantity,
      this.channel,
      this.contactEmail,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient opt out batch in status planned. */
export function newLenientOptOutBatch(code: string, label: string): LenientOptOutBatch {
  return new LenientOptOutBatch(code, label, "", "", "", 0, 0, 0, "", "", 0, "planned");
}
