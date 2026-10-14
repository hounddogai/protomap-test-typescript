/**
 * The capped funnel batch records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped funnel batch is in its life cycle. */
export type CappedFunnelBatchStatus = "created" | "validated" | "published" | "retired";

/** One capped funnel batch, with what the planners need to act on it. */
export class CappedFunnelBatch {
  code: string;
  name: string;
  visible: boolean;
  createdAt: number;
  title: string;
  clicks: number;
  status: CappedFunnelBatchStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    createdAt: number,
    title: string,
    clicks: number,
    status: CappedFunnelBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.createdAt = createdAt;
    this.title = title;
    this.clicks = clicks;
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

  canMoveTo(next: CappedFunnelBatchStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedFunnelBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped funnel batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.clicks * this.createdAt * 100) / 100;
  }

  copy(): CappedFunnelBatch {
    return new CappedFunnelBatch(
      this.code,
      this.name,
      this.visible,
      this.createdAt,
      this.title,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped funnel batch in status created. */
export function newCappedFunnelBatch(code: string, name: string): CappedFunnelBatch {
  return new CappedFunnelBatch(code, name, false, 0, "", 0, "created");
}
