/**
 * The streak request records of loyaltyhub's streak work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak request is in its life cycle. */
export type StreakRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** A streak request. Its code is unique within a tenant. */
export class StreakRequest {
  code: string;
  title: string;
  openRate: number;
  label: string;
  summary: string;
  externalRef: string;
  channel: string;
  conversionRate: number;
  sendAt: number;
  visible: boolean;
  startsAt: number;
  status: StreakRequestStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    label: string,
    summary: string,
    externalRef: string,
    channel: string,
    conversionRate: number,
    sendAt: number,
    visible: boolean,
    startsAt: number,
    status: StreakRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.label = label;
    this.summary = summary;
    this.externalRef = externalRef;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
    this.visible = visible;
    this.startsAt = startsAt;
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

  canMoveTo(next: StreakRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
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

  moveTo(next: StreakRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round((this.sendAt - this.startsAt) * 100) / 100;
  }

  copy(): StreakRequest {
    return new StreakRequest(
      this.code,
      this.title,
      this.openRate,
      this.label,
      this.summary,
      this.externalRef,
      this.channel,
      this.conversionRate,
      this.sendAt,
      this.visible,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a streak request in status requested. */
export function newStreakRequest(code: string, title: string): StreakRequest {
  return new StreakRequest(code, title, 0, "", "", "", "", 0, 0, false, 0, "requested");
}
