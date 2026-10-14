/**
 * The pending queue group records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending queue group is in its life cycle. */
export type PendingQueueGroupStatus = "created" | "validated" | "published" | "retired";

/** One pending queue group, with what the planners need to act on it. */
export class PendingQueueGroup {
  code: string;
  label: string;
  visible: boolean;
  bid: number;
  segment: string;
  reviewer: string;
  attributes: Map<string, string>;
  limit: number;
  checksum: string;
  margin: number;
  channel: string;
  status: PendingQueueGroupStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    bid: number,
    segment: string,
    reviewer: string,
    attributes: Map<string, string>,
    limit: number,
    checksum: string,
    margin: number,
    channel: string,
    status: PendingQueueGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.bid = bid;
    this.segment = segment;
    this.reviewer = reviewer;
    this.attributes = attributes;
    this.limit = limit;
    this.checksum = checksum;
    this.margin = margin;
    this.channel = channel;
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

  canMoveTo(next: PendingQueueGroupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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

  moveTo(next: PendingQueueGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending queue group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.limit - this.bid) * 100) / 100;
  }

  copy(): PendingQueueGroup {
    return new PendingQueueGroup(
      this.code,
      this.label,
      this.visible,
      this.bid,
      this.segment,
      this.reviewer,
      this.attributes,
      this.limit,
      this.checksum,
      this.margin,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending queue group in status created. */
export function newPendingQueueGroup(code: string, label: string): PendingQueueGroup {
  return new PendingQueueGroup(code, label, false, 0, "", "", new Map<string, string>(), 0, "", 0, "", "created");
}
