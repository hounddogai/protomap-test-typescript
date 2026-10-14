import * as text from "../../../../kit/text.js";

/** Where a fallback queue adjustment is in its life cycle. */
export type FallbackQueueAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback queue adjustment as the queue team keeps it. */
export class FallbackQueueAdjustment {
  code: string;
  title: string;
  ceiling: number;
  frequencyCap: number;
  endsAt: number;
  priority: number;
  revision: number;
  currency: string;
  tags: string[];
  locale: string;
  status: FallbackQueueAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    frequencyCap: number,
    endsAt: number,
    priority: number,
    revision: number,
    currency: string,
    tags: string[],
    locale: string,
    status: FallbackQueueAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.endsAt = endsAt;
    this.priority = priority;
    this.revision = revision;
    this.currency = currency;
    this.tags = tags;
    this.locale = locale;
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

  canMoveTo(next: FallbackQueueAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
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

  moveTo(next: FallbackQueueAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback queue adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round((this.endsAt - this.ceiling) * 100) / 100;
  }

  copy(): FallbackQueueAdjustment {
    return new FallbackQueueAdjustment(
      this.code,
      this.title,
      this.ceiling,
      this.frequencyCap,
      this.endsAt,
      this.priority,
      this.revision,
      this.currency,
      this.tags,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback queue adjustment in status proposed. */
export function newFallbackQueueAdjustment(code: string, title: string): FallbackQueueAdjustment {
  return new FallbackQueueAdjustment(code, title, 0, 0, 0, 0, 0, "", [], "", "proposed");
}
