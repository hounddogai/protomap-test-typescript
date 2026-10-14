/**
 * The seasonal enrollment window records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal enrollment window is in its life cycle. */
export type SeasonalEnrollmentWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal enrollment window. Its code is unique within a tenant. */
export class SeasonalEnrollmentWindow {
  code: string;
  title: string;
  limit: number;
  source: string;
  tags: string[];
  timezone: string;
  sendAt: number;
  windowDays: number;
  status: SeasonalEnrollmentWindowStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    source: string,
    tags: string[],
    timezone: string,
    sendAt: number,
    windowDays: number,
    status: SeasonalEnrollmentWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.source = source;
    this.tags = tags;
    this.timezone = timezone;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
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

  canMoveTo(next: SeasonalEnrollmentWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: SeasonalEnrollmentWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal enrollment window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.limit - this.sendAt) * 100) / 100;
  }

  copy(): SeasonalEnrollmentWindow {
    return new SeasonalEnrollmentWindow(
      this.code,
      this.title,
      this.limit,
      this.source,
      this.tags,
      this.timezone,
      this.sendAt,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal enrollment window in status idle. */
export function newSeasonalEnrollmentWindow(code: string, title: string): SeasonalEnrollmentWindow {
  return new SeasonalEnrollmentWindow(code, title, 0, "", [], "", 0, 0, "idle");
}
