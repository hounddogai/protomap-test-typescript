import * as text from "../../../../kit/text.js";

/** Where a strict placement draft is in its life cycle. */
export type StrictPlacementDraftStatus = "created" | "validated" | "published" | "retired";

/** One strict placement draft, with what the planners need to act on it. */
export class StrictPlacementDraft {
  code: string;
  title: string;
  locale: string;
  discount: number;
  quantity: number;
  attributes: Map<string, string>;
  summary: string;
  batchSize: number;
  status: StrictPlacementDraftStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    discount: number,
    quantity: number,
    attributes: Map<string, string>,
    summary: string,
    batchSize: number,
    status: StrictPlacementDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.discount = discount;
    this.quantity = quantity;
    this.attributes = attributes;
    this.summary = summary;
    this.batchSize = batchSize;
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

  canMoveTo(next: StrictPlacementDraftStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StrictPlacementDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict placement draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round(this.batchSize * this.quantity * 100) / 100;
  }

  copy(): StrictPlacementDraft {
    return new StrictPlacementDraft(
      this.code,
      this.title,
      this.locale,
      this.discount,
      this.quantity,
      this.attributes,
      this.summary,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict placement draft in status created. */
export function newStrictPlacementDraft(code: string, title: string): StrictPlacementDraft {
  return new StrictPlacementDraft(code, title, "", 0, 0, new Map<string, string>(), "", 0, "created");
}
