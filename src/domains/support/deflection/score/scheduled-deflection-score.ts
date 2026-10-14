/**
 * The scheduled deflection score records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled deflection score is in its life cycle. */
export type ScheduledDeflectionScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled deflection score. Its code is unique within a tenant. */
export class ScheduledDeflectionScore {
  code: string;
  label: string;
  journeyId: string;
  weight: number;
  channel: string;
  attributes: Map<string, string>;
  status: ScheduledDeflectionScoreStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    weight: number,
    channel: string,
    attributes: Map<string, string>,
    status: ScheduledDeflectionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.weight = weight;
    this.channel = channel;
    this.attributes = attributes;
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

  canMoveTo(next: ScheduledDeflectionScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledDeflectionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled deflection score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  measuredValue(): number {
    return this.weight;
  }

  copy(): ScheduledDeflectionScore {
    return new ScheduledDeflectionScore(
      this.code,
      this.label,
      this.journeyId,
      this.weight,
      this.channel,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled deflection score in status requested. */
export function newScheduledDeflectionScore(code: string, label: string): ScheduledDeflectionScore {
  return new ScheduledDeflectionScore(code, label, "", 0, "", new Map<string, string>(), "requested");
}
