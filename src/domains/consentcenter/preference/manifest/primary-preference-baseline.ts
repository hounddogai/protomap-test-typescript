import * as text from "../../../../kit/text.js";

/** Where a primary preference baseline is in its life cycle. */
export type PrimaryPreferenceBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** One primary preference baseline, with what the planners need to act on it. */
export class PrimaryPreferenceBaseline {
  code: string;
  title: string;
  discount: number;
  quantity: number;
  endsAt: number;
  locale: string;
  sequence: number;
  attributes: Map<string, string>;
  status: PrimaryPreferenceBaselineStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    quantity: number,
    endsAt: number,
    locale: string,
    sequence: number,
    attributes: Map<string, string>,
    status: PrimaryPreferenceBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.quantity = quantity;
    this.endsAt = endsAt;
    this.locale = locale;
    this.sequence = sequence;
    this.attributes = attributes;
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

  canMoveTo(next: PrimaryPreferenceBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryPreferenceBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary preference baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary preference baseline"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round((this.quantity + this.endsAt) * 100) / 100;
  }

  copy(): PrimaryPreferenceBaseline {
    return new PrimaryPreferenceBaseline(
      this.code,
      this.title,
      this.discount,
      this.quantity,
      this.endsAt,
      this.locale,
      this.sequence,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary preference baseline in status new. */
export function newPrimaryPreferenceBaseline(code: string, title: string): PrimaryPreferenceBaseline {
  return new PrimaryPreferenceBaseline(code, title, 0, 0, 0, "", 0, new Map<string, string>(), "new");
}
