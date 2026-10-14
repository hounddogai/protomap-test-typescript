import * as text from "../../../../kit/text.js";

/** Where a badge slot is in its life cycle. */
export type BadgeSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A badge slot as the badge team keeps it. */
export class BadgeSlot {
  code: string;
  label: string;
  locale: string;
  description: string;
  ownerId: string;
  archived: boolean;
  expiresAt: number;
  budget: number;
  endsAt: number;
  attributes: Map<string, string>;
  title: string;
  status: BadgeSlotStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    description: string,
    ownerId: string,
    archived: boolean,
    expiresAt: number,
    budget: number,
    endsAt: number,
    attributes: Map<string, string>,
    title: string,
    status: BadgeSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.description = description;
    this.ownerId = ownerId;
    this.archived = archived;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.endsAt = endsAt;
    this.attributes = attributes;
    this.title = title;
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

  canMoveTo(next: BadgeSlotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "running";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.budget + this.endsAt) * 100) / 100;
  }

  copy(): BadgeSlot {
    return new BadgeSlot(
      this.code,
      this.label,
      this.locale,
      this.description,
      this.ownerId,
      this.archived,
      this.expiresAt,
      this.budget,
      this.endsAt,
      this.attributes,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a badge slot in status new. */
export function newBadgeSlot(code: string, label: string): BadgeSlot {
  return new BadgeSlot(code, label, "", "", "", false, 0, 0, 0, new Map<string, string>(), "", "new");
}
