import * as text from "../../../../kit/text.js";

/** Where a suppression entry is in its life cycle. */
export type SuppressionEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A suppression entry as the suppression team keeps it. */
export class SuppressionEntry {
  code: string;
  title: string;
  externalRef: string;
  archived: boolean;
  attributes: Map<string, string>;
  quantity: number;
  status: SuppressionEntryStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    archived: boolean,
    attributes: Map<string, string>,
    quantity: number,
    status: SuppressionEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.archived = archived;
    this.attributes = attributes;
    this.quantity = quantity;
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

  canMoveTo(next: SuppressionEntryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SuppressionEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): SuppressionEntry {
    return new SuppressionEntry(
      this.code,
      this.title,
      this.externalRef,
      this.archived,
      this.attributes,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a suppression entry in status new. */
export function newSuppressionEntry(code: string, title: string): SuppressionEntry {
  return new SuppressionEntry(code, title, "", false, new Map<string, string>(), 0, "new");
}
