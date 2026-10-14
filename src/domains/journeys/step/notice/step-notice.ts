/**
 * The step notice records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step notice is in its life cycle. */
export type StepNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One step notice, with what the planners need to act on it. */
export class StepNotice {
  code: string;
  name: string;
  version: number;
  impressions: number;
  priority: number;
  retries: number;
  ratio: number;
  sendAt: number;
  audienceId: string;
  durationMinutes: number;
  updatedAt: number;
  status: StepNoticeStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    impressions: number,
    priority: number,
    retries: number,
    ratio: number,
    sendAt: number,
    audienceId: string,
    durationMinutes: number,
    updatedAt: number,
    status: StepNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.impressions = impressions;
    this.priority = priority;
    this.retries = retries;
    this.ratio = ratio;
    this.sendAt = sendAt;
    this.audienceId = audienceId;
    this.durationMinutes = durationMinutes;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: StepNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StepNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.updatedAt * this.priority * 100) / 100;
  }

  copy(): StepNotice {
    return new StepNotice(
      this.code,
      this.name,
      this.version,
      this.impressions,
      this.priority,
      this.retries,
      this.ratio,
      this.sendAt,
      this.audienceId,
      this.durationMinutes,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a step notice in status planned. */
export function newStepNotice(code: string, name: string): StepNotice {
  return new StepNotice(code, name, 0, 0, 0, 0, 0, 0, "", 0, 0, "planned");
}
