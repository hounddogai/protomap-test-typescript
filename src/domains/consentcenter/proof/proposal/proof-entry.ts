import * as text from "../../../../kit/text.js";

/** Where a proof entry is in its life cycle. */
export type ProofEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One proof entry, with what the planners need to act on it. */
export class ProofEntry {
  code: string;
  title: string;
  unit: string;
  discount: number;
  tags: string[];
  revision: number;
  frequencyCap: number;
  archived: boolean;
  pinned: boolean;
  visible: boolean;
  bid: number;
  status: ProofEntryStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    discount: number,
    tags: string[],
    revision: number,
    frequencyCap: number,
    archived: boolean,
    pinned: boolean,
    visible: boolean,
    bid: number,
    status: ProofEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.discount = discount;
    this.tags = tags;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.archived = archived;
    this.pinned = pinned;
    this.visible = visible;
    this.bid = bid;
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

  canMoveTo(next: ProofEntryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"proof entry"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.discount - this.frequencyCap) * 100) / 100;
  }

  copy(): ProofEntry {
    return new ProofEntry(
      this.code,
      this.title,
      this.unit,
      this.discount,
      this.tags,
      this.revision,
      this.frequencyCap,
      this.archived,
      this.pinned,
      this.visible,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a proof entry in status new. */
export function newProofEntry(code: string, title: string): ProofEntry {
  return new ProofEntry(code, title, "", 0, [], 0, 0, false, false, false, 0, "new");
}
