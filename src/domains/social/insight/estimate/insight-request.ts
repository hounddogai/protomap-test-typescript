import * as text from "../../../../kit/text.js";

/** Where a insight request is in its life cycle. */
export type InsightRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A insight request. Its code is unique within a tenant. */
export class InsightRequest {
  code: string;
  title: string;
  windowDays: number;
  segment: string;
  expiresAt: number;
  status: InsightRequestStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    segment: string,
    expiresAt: number,
    status: InsightRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.segment = segment;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: InsightRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: InsightRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round((this.windowDays + this.expiresAt) * 100) / 100;
  }

  copy(): InsightRequest {
    return new InsightRequest(this.code, this.title, this.windowDays, this.segment, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a insight request in status idle. */
export function newInsightRequest(code: string, title: string): InsightRequest {
  return new InsightRequest(code, title, 0, "", 0, "idle");
}
