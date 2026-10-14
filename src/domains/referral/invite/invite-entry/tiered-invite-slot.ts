import * as text from "../../../../kit/text.js";

/** Where a tiered invite slot is in its life cycle. */
export type TieredInviteSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered invite slot. Its code is unique within a tenant. */
export class TieredInviteSlot {
  code: string;
  label: string;
  quantity: number;
  endsAt: number;
  budget: number;
  tags: string[];
  attributes: Map<string, string>;
  locale: string;
  ceiling: number;
  status: TieredInviteSlotStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    endsAt: number,
    budget: number,
    tags: string[],
    attributes: Map<string, string>,
    locale: string,
    ceiling: number,
    status: TieredInviteSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.endsAt = endsAt;
    this.budget = budget;
    this.tags = tags;
    this.attributes = attributes;
    this.locale = locale;
    this.ceiling = ceiling;
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

  canMoveTo(next: TieredInviteSlotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredInviteSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered invite slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered invite slot"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round(this.budget * this.quantity * 100) / 100;
  }

  copy(): TieredInviteSlot {
    return new TieredInviteSlot(
      this.code,
      this.label,
      this.quantity,
      this.endsAt,
      this.budget,
      this.tags,
      this.attributes,
      this.locale,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered invite slot in status open. */
export function newTieredInviteSlot(code: string, label: string): TieredInviteSlot {
  return new TieredInviteSlot(code, label, 0, 0, 0, [], new Map<string, string>(), "", 0, "open");
}
