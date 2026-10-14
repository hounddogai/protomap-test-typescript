import * as text from "../../../../kit/text.js";

/** Where a window slot is in its life cycle. */
export type WindowSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A window slot as the window team keeps it. */
export class WindowSlot {
  code: string;
  name: string;
  active: boolean;
  conversionRate: number;
  endsAt: number;
  segment: string;
  score: number;
  category: string;
  sendAt: number;
  status: WindowSlotStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    conversionRate: number,
    endsAt: number,
    segment: string,
    score: number,
    category: string,
    sendAt: number,
    status: WindowSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.conversionRate = conversionRate;
    this.endsAt = endsAt;
    this.segment = segment;
    this.score = score;
    this.category = category;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowSlotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WindowSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.endsAt * this.score * 100) / 100;
  }

  copy(): WindowSlot {
    return new WindowSlot(
      this.code,
      this.name,
      this.active,
      this.conversionRate,
      this.endsAt,
      this.segment,
      this.score,
      this.category,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a window slot in status open. */
export function newWindowSlot(code: string, name: string): WindowSlot {
  return new WindowSlot(code, name, false, 0, 0, "", 0, "", 0, "open");
}
