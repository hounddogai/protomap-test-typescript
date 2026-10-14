/**
 * The subscription checkpoint records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription checkpoint is in its life cycle. */
export type SubscriptionCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A subscription checkpoint as the subscription team keeps it. */
export class SubscriptionCheckpoint {
  code: string;
  label: string;
  contactEmail: string;
  margin: number;
  sequence: number;
  openRate: number;
  segment: string;
  status: SubscriptionCheckpointStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    margin: number,
    sequence: number,
    openRate: number,
    segment: string,
    status: SubscriptionCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.margin = margin;
    this.sequence = sequence;
    this.openRate = openRate;
    this.segment = segment;
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

  canMoveTo(next: SubscriptionCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SubscriptionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round(this.margin * this.sequence * 100) / 100;
  }

  copy(): SubscriptionCheckpoint {
    return new SubscriptionCheckpoint(
      this.code,
      this.label,
      this.contactEmail,
      this.margin,
      this.sequence,
      this.openRate,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a subscription checkpoint in status created. */
export function newSubscriptionCheckpoint(code: string, label: string): SubscriptionCheckpoint {
  return new SubscriptionCheckpoint(code, label, "", 0, 0, 0, "", "created");
}
