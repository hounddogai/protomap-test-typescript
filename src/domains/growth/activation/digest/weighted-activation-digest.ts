/**
 * The weighted activation digest records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted activation digest is in its life cycle. */
export type WeightedActivationDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a weighted activation digest and its current status. */
export class WeightedActivationDigest {
  code: string;
  label: string;
  priority: number;
  threshold: number;
  sequence: number;
  attributes: Map<string, string>;
  attempts: number;
  channel: string;
  maximum: number;
  status: WeightedActivationDigestStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    threshold: number,
    sequence: number,
    attributes: Map<string, string>,
    attempts: number,
    channel: string,
    maximum: number,
    status: WeightedActivationDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.threshold = threshold;
    this.sequence = sequence;
    this.attributes = attributes;
    this.attempts = attempts;
    this.channel = channel;
    this.maximum = maximum;
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

  canMoveTo(next: WeightedActivationDigestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "running";
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

  moveTo(next: WeightedActivationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted activation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted activation digest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.maximum - this.threshold) * 100) / 100;
  }

  copy(): WeightedActivationDigest {
    return new WeightedActivationDigest(
      this.code,
      this.label,
      this.priority,
      this.threshold,
      this.sequence,
      this.attributes,
      this.attempts,
      this.channel,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted activation digest in status new. */
export function newWeightedActivationDigest(code: string, label: string): WeightedActivationDigest {
  return new WeightedActivationDigest(code, label, 0, 0, 0, new Map<string, string>(), 0, "", 0, "new");
}
