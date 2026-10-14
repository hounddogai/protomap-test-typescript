/**
 * The mention preference records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention preference is in its life cycle. */
export type MentionPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a mention preference and its current status. */
export class MentionPreference {
  code: string;
  name: string;
  phone: string;
  unit: string;
  score: number;
  timezone: string;
  status: MentionPreferenceStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    unit: string,
    score: number,
    timezone: string,
    status: MentionPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.unit = unit;
    this.score = score;
    this.timezone = timezone;
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

  canMoveTo(next: MentionPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): MentionPreference {
    return new MentionPreference(this.code, this.name, this.phone, this.unit, this.score, this.timezone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a mention preference in status requested. */
export function newMentionPreference(code: string, name: string): MentionPreference {
  return new MentionPreference(code, name, "", "", 0, "", "requested");
}
