import * as text from "../../../../kit/text.js";

/** Where a capped reply quota is in its life cycle. */
export type CappedReplyQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a capped reply quota and its current status. */
export class CappedReplyQuota {
  code: string;
  label: string;
  ratio: number;
  ceiling: number;
  notes: string;
  source: string;
  ownerId: string;
  attributes: Map<string, string>;
  category: string;
  status: CappedReplyQuotaStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    ceiling: number,
    notes: string,
    source: string,
    ownerId: string,
    attributes: Map<string, string>,
    category: string,
    status: CappedReplyQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.ceiling = ceiling;
    this.notes = notes;
    this.source = source;
    this.ownerId = ownerId;
    this.attributes = attributes;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedReplyQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedReplyQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped reply quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round(this.ratio * this.ceiling * 100) / 100;
  }

  copy(): CappedReplyQuota {
    return new CappedReplyQuota(
      this.code,
      this.label,
      this.ratio,
      this.ceiling,
      this.notes,
      this.source,
      this.ownerId,
      this.attributes,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped reply quota in status idle. */
export function newCappedReplyQuota(code: string, label: string): CappedReplyQuota {
  return new CappedReplyQuota(code, label, 0, 0, "", "", "", new Map<string, string>(), "", "idle");
}
