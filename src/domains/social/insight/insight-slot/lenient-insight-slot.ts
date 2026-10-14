/**
 * The lenient insight slot records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient insight slot is in its life cycle. */
export type LenientInsightSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One lenient insight slot, with what the planners need to act on it. */
export class LenientInsightSlot {
  code: string;
  title: string;
  locale: string;
  name: string;
  visible: boolean;
  segment: string;
  sendAt: number;
  status: LenientInsightSlotStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    name: string,
    visible: boolean,
    segment: string,
    sendAt: number,
    status: LenientInsightSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.name = name;
    this.visible = visible;
    this.segment = segment;
    this.sendAt = sendAt;
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

  canMoveTo(next: LenientInsightSlotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientInsightSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient insight slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): LenientInsightSlot {
    return new LenientInsightSlot(
      this.code,
      this.title,
      this.locale,
      this.name,
      this.visible,
      this.segment,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient insight slot in status new. */
export function newLenientInsightSlot(code: string, title: string): LenientInsightSlot {
  return new LenientInsightSlot(code, title, "", "", false, "", 0, "new");
}
