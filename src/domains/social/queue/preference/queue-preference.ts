/**
 * The queue preference records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue preference is in its life cycle. */
export type QueuePreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A queue preference. Its code is unique within a tenant. */
export class QueuePreference {
  code: string;
  label: string;
  amount: number;
  contactEmail: string;
  endsAt: number;
  campaignRef: string;
  budget: number;
  reviewer: string;
  timezone: string;
  startsAt: number;
  ownerId: string;
  status: QueuePreferenceStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    contactEmail: string,
    endsAt: number,
    campaignRef: string,
    budget: number,
    reviewer: string,
    timezone: string,
    startsAt: number,
    ownerId: string,
    status: QueuePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.endsAt = endsAt;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.reviewer = reviewer;
    this.timezone = timezone;
    this.startsAt = startsAt;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueuePreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueuePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"queue preference"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.endsAt * this.budget * 100) / 100;
  }

  copy(): QueuePreference {
    return new QueuePreference(
      this.code,
      this.label,
      this.amount,
      this.contactEmail,
      this.endsAt,
      this.campaignRef,
      this.budget,
      this.reviewer,
      this.timezone,
      this.startsAt,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a queue preference in status planned. */
export function newQueuePreference(code: string, label: string): QueuePreference {
  return new QueuePreference(code, label, 0, "", 0, "", 0, "", "", 0, "", "planned");
}
