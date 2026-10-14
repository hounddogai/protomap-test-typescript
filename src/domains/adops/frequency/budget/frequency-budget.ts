/**
 * The frequency budget records of adops's frequency work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a frequency budget is in its life cycle. */
export type FrequencyBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** One frequency budget, with what the planners need to act on it. */
export class FrequencyBudget {
  code: string;
  title: string;
  locale: string;
  journeyId: string;
  capacity: number;
  sendAt: number;
  variant: string;
  source: string;
  ownerId: string;
  utmSource: string;
  retries: number;
  status: FrequencyBudgetStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    journeyId: string,
    capacity: number,
    sendAt: number,
    variant: string,
    source: string,
    ownerId: string,
    utmSource: string,
    retries: number,
    status: FrequencyBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.journeyId = journeyId;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.variant = variant;
    this.source = source;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.retries = retries;
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

  canMoveTo(next: FrequencyBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"frequency budget"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.sendAt - this.retries) * 100) / 100;
  }

  copy(): FrequencyBudget {
    return new FrequencyBudget(
      this.code,
      this.title,
      this.locale,
      this.journeyId,
      this.capacity,
      this.sendAt,
      this.variant,
      this.source,
      this.ownerId,
      this.utmSource,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a frequency budget in status requested. */
export function newFrequencyBudget(code: string, title: string): FrequencyBudget {
  return new FrequencyBudget(code, title, "", "", 0, 0, "", "", "", "", 0, "requested");
}
