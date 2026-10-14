/**
 * The batched path preference records of attribution's path work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched path preference is in its life cycle. */
export type BatchedPathPreferenceStatus = "created" | "validated" | "published" | "retired";

/** A batched path preference as the path team keeps it. */
export class BatchedPathPreference {
  code: string;
  title: string;
  segment: string;
  phone: string;
  label: string;
  reviewer: string;
  channel: string;
  region: string;
  score: number;
  status: BatchedPathPreferenceStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    phone: string,
    label: string,
    reviewer: string,
    channel: string,
    region: string,
    score: number,
    status: BatchedPathPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.phone = phone;
    this.label = label;
    this.reviewer = reviewer;
    this.channel = channel;
    this.region = region;
    this.score = score;
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

  canMoveTo(next: BatchedPathPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPathPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched path preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): BatchedPathPreference {
    return new BatchedPathPreference(
      this.code,
      this.title,
      this.segment,
      this.phone,
      this.label,
      this.reviewer,
      this.channel,
      this.region,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched path preference in status created. */
export function newBatchedPathPreference(code: string, title: string): BatchedPathPreference {
  return new BatchedPathPreference(code, title, "", "", "", "", "", "", 0, "created");
}
