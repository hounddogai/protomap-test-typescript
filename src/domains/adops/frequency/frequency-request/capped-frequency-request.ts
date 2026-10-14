/**
 * The capped frequency request records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped frequency request is in its life cycle. */
export type CappedFrequencyRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One capped frequency request, with what the planners need to act on it. */
export class CappedFrequencyRequest {
  code: string;
  label: string;
  maximum: number;
  cost: number;
  capacity: number;
  revision: number;
  attributes: Map<string, string>;
  batchSize: number;
  name: string;
  channel: string;
  endsAt: number;
  status: CappedFrequencyRequestStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    cost: number,
    capacity: number,
    revision: number,
    attributes: Map<string, string>,
    batchSize: number,
    name: string,
    channel: string,
    endsAt: number,
    status: CappedFrequencyRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.cost = cost;
    this.capacity = capacity;
    this.revision = revision;
    this.attributes = attributes;
    this.batchSize = batchSize;
    this.name = name;
    this.channel = channel;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFrequencyRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedFrequencyRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped frequency request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
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

  adjustedVolume(): number {
    return Math.round(this.batchSize * this.capacity * 100) / 100;
  }

  copy(): CappedFrequencyRequest {
    return new CappedFrequencyRequest(
      this.code,
      this.label,
      this.maximum,
      this.cost,
      this.capacity,
      this.revision,
      this.attributes,
      this.batchSize,
      this.name,
      this.channel,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped frequency request in status open. */
export function newCappedFrequencyRequest(code: string, label: string): CappedFrequencyRequest {
  return new CappedFrequencyRequest(code, label, 0, 0, 0, 0, new Map<string, string>(), 0, "", "", 0, "open");
}
