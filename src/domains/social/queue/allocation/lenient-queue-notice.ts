import * as text from "../../../../kit/text.js";

/** Where a lenient queue notice is in its life cycle. */
export type LenientQueueNoticeStatus = "created" | "validated" | "published" | "retired";

/** A lenient queue notice. Its code is unique within a tenant. */
export class LenientQueueNotice {
  code: string;
  label: string;
  tags: string[];
  currency: string;
  durationMinutes: number;
  variant: string;
  status: LenientQueueNoticeStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    currency: string,
    durationMinutes: number,
    variant: string,
    status: LenientQueueNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.currency = currency;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
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

  canMoveTo(next: LenientQueueNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientQueueNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient queue notice ${this.code} cannot move from ${this.status} to ${next}`);
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

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): LenientQueueNotice {
    return new LenientQueueNotice(
      this.code,
      this.label,
      this.tags,
      this.currency,
      this.durationMinutes,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient queue notice in status created. */
export function newLenientQueueNotice(code: string, label: string): LenientQueueNotice {
  return new LenientQueueNotice(code, label, [], "", 0, "", "created");
}
