/**
 * The lenient queue draft records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient queue draft is in its life cycle. */
export type LenientQueueDraftStatus = "created" | "validated" | "published" | "retired";

/** The record of a lenient queue draft and its current status. */
export class LenientQueueDraft {
  code: string;
  label: string;
  utmSource: string;
  category: string;
  unit: string;
  visible: boolean;
  capacity: number;
  country: string;
  source: string;
  checksum: string;
  status: LenientQueueDraftStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    category: string,
    unit: string,
    visible: boolean,
    capacity: number,
    country: string,
    source: string,
    checksum: string,
    status: LenientQueueDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.category = category;
    this.unit = unit;
    this.visible = visible;
    this.capacity = capacity;
    this.country = country;
    this.source = source;
    this.checksum = checksum;
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

  canMoveTo(next: LenientQueueDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientQueueDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient queue draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient queue draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): LenientQueueDraft {
    return new LenientQueueDraft(
      this.code,
      this.label,
      this.utmSource,
      this.category,
      this.unit,
      this.visible,
      this.capacity,
      this.country,
      this.source,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient queue draft in status created. */
export function newLenientQueueDraft(code: string, label: string): LenientQueueDraft {
  return new LenientQueueDraft(code, label, "", "", "", false, 0, "", "", "", "created");
}
