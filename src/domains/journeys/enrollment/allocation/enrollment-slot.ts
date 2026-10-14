import * as text from "../../../../kit/text.js";

/** Where a enrollment slot is in its life cycle. */
export type EnrollmentSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a enrollment slot and its current status. */
export class EnrollmentSlot {
  code: string;
  title: string;
  channel: string;
  threshold: number;
  locale: string;
  utmSource: string;
  sendAt: number;
  batchSize: number;
  tags: string[];
  status: EnrollmentSlotStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    threshold: number,
    locale: string,
    utmSource: string,
    sendAt: number,
    batchSize: number,
    tags: string[],
    status: EnrollmentSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.threshold = threshold;
    this.locale = locale;
    this.utmSource = utmSource;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
    this.tags = tags;
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

  canMoveTo(next: EnrollmentSlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: EnrollmentSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round(this.threshold * this.sendAt * 100) / 100;
  }

  copy(): EnrollmentSlot {
    return new EnrollmentSlot(
      this.code,
      this.title,
      this.channel,
      this.threshold,
      this.locale,
      this.utmSource,
      this.sendAt,
      this.batchSize,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a enrollment slot in status new. */
export function newEnrollmentSlot(code: string, title: string): EnrollmentSlot {
  return new EnrollmentSlot(code, title, "", 0, "", "", 0, 0, [], "new");
}
