/**
 * The lenient fraud check score records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient fraud check score is in its life cycle. */
export type LenientFraudCheckScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One lenient fraud check score, with what the planners need to act on it. */
export class LenientFraudCheckScore {
  code: string;
  label: string;
  openRate: number;
  score: number;
  budget: number;
  sendAt: number;
  attributes: Map<string, string>;
  archived: boolean;
  version: number;
  channel: string;
  status: LenientFraudCheckScoreStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    score: number,
    budget: number,
    sendAt: number,
    attributes: Map<string, string>,
    archived: boolean,
    version: number,
    channel: string,
    status: LenientFraudCheckScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.score = score;
    this.budget = budget;
    this.sendAt = sendAt;
    this.attributes = attributes;
    this.archived = archived;
    this.version = version;
    this.channel = channel;
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

  canMoveTo(next: LenientFraudCheckScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientFraudCheckScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient fraud check score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round(this.budget * this.score * 100) / 100;
  }

  copy(): LenientFraudCheckScore {
    return new LenientFraudCheckScore(
      this.code,
      this.label,
      this.openRate,
      this.score,
      this.budget,
      this.sendAt,
      this.attributes,
      this.archived,
      this.version,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient fraud check score in status idle. */
export function newLenientFraudCheckScore(code: string, label: string): LenientFraudCheckScore {
  return new LenientFraudCheckScore(code, label, 0, 0, 0, 0, new Map<string, string>(), false, 0, "", "idle");
}
