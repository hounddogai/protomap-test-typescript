import * as text from "../../../../kit/text.js";

/** Where a tiered bounce manifest is in its life cycle. */
export type TieredBounceManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered bounce manifest as the bounce team keeps it. */
export class TieredBounceManifest {
  code: string;
  title: string;
  segment: string;
  revision: number;
  locale: string;
  approved: boolean;
  cost: number;
  notes: string;
  minimum: number;
  description: string;
  pinned: boolean;
  status: TieredBounceManifestStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    revision: number,
    locale: string,
    approved: boolean,
    cost: number,
    notes: string,
    minimum: number,
    description: string,
    pinned: boolean,
    status: TieredBounceManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.revision = revision;
    this.locale = locale;
    this.approved = approved;
    this.cost = cost;
    this.notes = notes;
    this.minimum = minimum;
    this.description = description;
    this.pinned = pinned;
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

  canMoveTo(next: TieredBounceManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "done";
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

  moveTo(next: TieredBounceManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bounce manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round((this.revision - this.minimum) * 100) / 100;
  }

  copy(): TieredBounceManifest {
    return new TieredBounceManifest(
      this.code,
      this.title,
      this.segment,
      this.revision,
      this.locale,
      this.approved,
      this.cost,
      this.notes,
      this.minimum,
      this.description,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered bounce manifest in status new. */
export function newTieredBounceManifest(code: string, title: string): TieredBounceManifest {
  return new TieredBounceManifest(code, title, "", 0, "", false, 0, "", 0, "", false, "new");
}
