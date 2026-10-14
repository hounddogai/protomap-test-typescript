import * as text from "../../../../kit/text.js";

/** Where a payout batch is in its life cycle. */
export type PayoutBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One payout batch, with what the planners need to act on it. */
export class PayoutBatch {
  code: string;
  label: string;
  archived: boolean;
  tags: string[];
  durationMinutes: number;
  margin: number;
  limit: number;
  locale: string;
  channel: string;
  status: PayoutBatchStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    tags: string[],
    durationMinutes: number,
    margin: number,
    limit: number,
    locale: string,
    channel: string,
    status: PayoutBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.tags = tags;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
    this.limit = limit;
    this.locale = locale;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PayoutBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.durationMinutes + this.limit) * 100) / 100;
  }

  copy(): PayoutBatch {
    return new PayoutBatch(
      this.code,
      this.label,
      this.archived,
      this.tags,
      this.durationMinutes,
      this.margin,
      this.limit,
      this.locale,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a payout batch in status idle. */
export function newPayoutBatch(code: string, label: string): PayoutBatch {
  return new PayoutBatch(code, label, false, [], 0, 0, 0, "", "", "idle");
}
