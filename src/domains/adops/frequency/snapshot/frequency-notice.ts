import * as text from "../../../../kit/text.js";

/** Where a frequency notice is in its life cycle. */
export type FrequencyNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a frequency notice and its current status. */
export class FrequencyNotice {
  code: string;
  label: string;
  budget: number;
  createdAt: number;
  name: string;
  status: FrequencyNoticeStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    createdAt: number,
    name: string,
    status: FrequencyNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.createdAt = createdAt;
    this.name = name;
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

  canMoveTo(next: FrequencyNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.budget + this.createdAt) * 100) / 100;
  }

  copy(): FrequencyNotice {
    return new FrequencyNotice(this.code, this.label, this.budget, this.createdAt, this.name, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a frequency notice in status idle. */
export function newFrequencyNotice(code: string, label: string): FrequencyNotice {
  return new FrequencyNotice(code, label, 0, 0, "", "idle");
}
