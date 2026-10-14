import * as text from "../../../../kit/text.js";

/** Where a strict queue manifest is in its life cycle. */
export type StrictQueueManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict queue manifest and its current status. */
export class StrictQueueManifest {
  code: string;
  title: string;
  region: string;
  updatedAt: number;
  amount: number;
  status: StrictQueueManifestStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    updatedAt: number,
    amount: number,
    status: StrictQueueManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.updatedAt = updatedAt;
    this.amount = amount;
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

  canMoveTo(next: StrictQueueManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictQueueManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict queue manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round(this.amount * this.updatedAt * 100) / 100;
  }

  copy(): StrictQueueManifest {
    return new StrictQueueManifest(this.code, this.title, this.region, this.updatedAt, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict queue manifest in status new. */
export function newStrictQueueManifest(code: string, title: string): StrictQueueManifest {
  return new StrictQueueManifest(code, title, "", 0, 0, "new");
}
