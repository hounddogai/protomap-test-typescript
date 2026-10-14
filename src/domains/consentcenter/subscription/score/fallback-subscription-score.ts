/**
 * The fallback subscription score records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback subscription score is in its life cycle. */
export type FallbackSubscriptionScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** One fallback subscription score, with what the planners need to act on it. */
export class FallbackSubscriptionScore {
  code: string;
  label: string;
  externalRef: string;
  priority: number;
  ceiling: number;
  contactEmail: string;
  ratio: number;
  ownerId: string;
  channel: string;
  visible: boolean;
  checksum: string;
  status: FallbackSubscriptionScoreStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    priority: number,
    ceiling: number,
    contactEmail: string,
    ratio: number,
    ownerId: string,
    channel: string,
    visible: boolean,
    checksum: string,
    status: FallbackSubscriptionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.priority = priority;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.ownerId = ownerId;
    this.channel = channel;
    this.visible = visible;
    this.checksum = checksum;
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

  canMoveTo(next: FallbackSubscriptionScoreStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: FallbackSubscriptionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback subscription score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.priority + this.ratio) * 100) / 100;
  }

  copy(): FallbackSubscriptionScore {
    return new FallbackSubscriptionScore(
      this.code,
      this.label,
      this.externalRef,
      this.priority,
      this.ceiling,
      this.contactEmail,
      this.ratio,
      this.ownerId,
      this.channel,
      this.visible,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback subscription score in status new. */
export function newFallbackSubscriptionScore(code: string, label: string): FallbackSubscriptionScore {
  return new FallbackSubscriptionScore(code, label, "", 0, 0, "", 0, "", "", false, "", "new");
}
