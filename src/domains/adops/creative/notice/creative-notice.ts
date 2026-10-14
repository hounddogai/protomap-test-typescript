/**
 * The creative notice records of adops's creative work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative notice is in its life cycle. */
export type CreativeNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a creative notice and its current status. */
export class CreativeNotice {
  code: string;
  title: string;
  attempts: number;
  endsAt: number;
  frequencyCap: number;
  locale: string;
  weight: number;
  status: CreativeNoticeStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    endsAt: number,
    frequencyCap: number,
    locale: string,
    weight: number,
    status: CreativeNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.frequencyCap = frequencyCap;
    this.locale = locale;
    this.weight = weight;
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

  canMoveTo(next: CreativeNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
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

  moveTo(next: CreativeNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"creative notice"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.attempts * this.frequencyCap * 100) / 100;
  }

  copy(): CreativeNotice {
    return new CreativeNotice(
      this.code,
      this.title,
      this.attempts,
      this.endsAt,
      this.frequencyCap,
      this.locale,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a creative notice in status requested. */
export function newCreativeNotice(code: string, title: string): CreativeNotice {
  return new CreativeNotice(code, title, 0, 0, 0, "", 0, "requested");
}
