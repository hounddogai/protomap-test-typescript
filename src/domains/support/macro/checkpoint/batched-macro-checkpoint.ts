/**
 * The batched macro checkpoint records of support's macro work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched macro checkpoint is in its life cycle. */
export type BatchedMacroCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** One batched macro checkpoint, with what the planners need to act on it. */
export class BatchedMacroCheckpoint {
  code: string;
  title: string;
  summary: string;
  attempts: number;
  visible: boolean;
  pinned: boolean;
  channel: string;
  limit: number;
  attributes: Map<string, string>;
  locale: string;
  description: string;
  status: BatchedMacroCheckpointStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    attempts: number,
    visible: boolean,
    pinned: boolean,
    channel: string,
    limit: number,
    attributes: Map<string, string>,
    locale: string,
    description: string,
    status: BatchedMacroCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.attempts = attempts;
    this.visible = visible;
    this.pinned = pinned;
    this.channel = channel;
    this.limit = limit;
    this.attributes = attributes;
    this.locale = locale;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedMacroCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedMacroCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched macro checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched macro checkpoint"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round((this.attempts + this.limit) * 100) / 100;
  }

  copy(): BatchedMacroCheckpoint {
    return new BatchedMacroCheckpoint(
      this.code,
      this.title,
      this.summary,
      this.attempts,
      this.visible,
      this.pinned,
      this.channel,
      this.limit,
      this.attributes,
      this.locale,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched macro checkpoint in status requested. */
export function newBatchedMacroCheckpoint(code: string, title: string): BatchedMacroCheckpoint {
  return new BatchedMacroCheckpoint(
    code,
    title,
    "",
    0,
    false,
    false,
    "",
    0,
    new Map<string, string>(),
    "",
    "",
    "requested",
  );
}
