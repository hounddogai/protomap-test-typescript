/**
 * The insight preference records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight preference is in its life cycle. */
export type InsightPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A insight preference. Its code is unique within a tenant. */
export class InsightPreference {
  code: string;
  name: string;
  frequencyCap: number;
  score: number;
  currency: string;
  batchSize: number;
  rate: number;
  status: InsightPreferenceStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    score: number,
    currency: string,
    batchSize: number,
    rate: number,
    status: InsightPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.score = score;
    this.currency = currency;
    this.batchSize = batchSize;
    this.rate = rate;
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

  canMoveTo(next: InsightPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"insight preference"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.score - this.rate) * 100) / 100;
  }

  copy(): InsightPreference {
    return new InsightPreference(
      this.code,
      this.name,
      this.frequencyCap,
      this.score,
      this.currency,
      this.batchSize,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a insight preference in status new. */
export function newInsightPreference(code: string, name: string): InsightPreference {
  return new InsightPreference(code, name, 0, 0, "", 0, 0, "new");
}
