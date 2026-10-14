import * as text from "../../../../kit/text.js";

/** Where a creative bundle is in its life cycle. */
export type CreativeBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One creative bundle, with what the planners need to act on it. */
export class CreativeBundle {
  code: string;
  name: string;
  bid: number;
  cohort: string;
  locale: string;
  notes: string;
  archived: boolean;
  createdAt: number;
  status: CreativeBundleStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    cohort: string,
    locale: string,
    notes: string,
    archived: boolean,
    createdAt: number,
    status: CreativeBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.cohort = cohort;
    this.locale = locale;
    this.notes = notes;
    this.archived = archived;
    this.createdAt = createdAt;
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

  canMoveTo(next: CreativeBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CreativeBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round(this.bid * this.createdAt * 100) / 100;
  }

  copy(): CreativeBundle {
    return new CreativeBundle(
      this.code,
      this.name,
      this.bid,
      this.cohort,
      this.locale,
      this.notes,
      this.archived,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a creative bundle in status new. */
export function newCreativeBundle(code: string, name: string): CreativeBundle {
  return new CreativeBundle(code, name, 0, "", "", "", false, 0, "new");
}
