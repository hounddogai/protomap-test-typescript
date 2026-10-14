import * as text from "../../../../kit/text.js";

/** Where a frequency draft is in its life cycle. */
export type FrequencyDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One frequency draft, with what the planners need to act on it. */
export class FrequencyDraft {
  code: string;
  name: string;
  journeyId: string;
  graceDays: number;
  batchSize: number;
  expiresAt: number;
  quantity: number;
  rate: number;
  status: FrequencyDraftStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    graceDays: number,
    batchSize: number,
    expiresAt: number,
    quantity: number,
    rate: number,
    status: FrequencyDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.graceDays = graceDays;
    this.batchSize = batchSize;
    this.expiresAt = expiresAt;
    this.quantity = quantity;
    this.rate = rate;
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

  canMoveTo(next: FrequencyDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedValue(): number {
    return Math.round(this.expiresAt * this.graceDays * 100) / 100;
  }

  copy(): FrequencyDraft {
    return new FrequencyDraft(
      this.code,
      this.name,
      this.journeyId,
      this.graceDays,
      this.batchSize,
      this.expiresAt,
      this.quantity,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a frequency draft in status idle. */
export function newFrequencyDraft(code: string, name: string): FrequencyDraft {
  return new FrequencyDraft(code, name, "", 0, 0, 0, 0, 0, "idle");
}
