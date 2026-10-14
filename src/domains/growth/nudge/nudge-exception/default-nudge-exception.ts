/**
 * The default nudge exception records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default nudge exception is in its life cycle. */
export type DefaultNudgeExceptionStatus = "created" | "validated" | "published" | "retired";

/** The record of a default nudge exception and its current status. */
export class DefaultNudgeException {
  code: string;
  label: string;
  expiresAt: number;
  channel: string;
  discount: number;
  status: DefaultNudgeExceptionStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    channel: string,
    discount: number,
    status: DefaultNudgeExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.channel = channel;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultNudgeExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultNudgeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default nudge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default nudge exception"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.expiresAt * this.discount * 100) / 100;
  }

  copy(): DefaultNudgeException {
    return new DefaultNudgeException(this.code, this.label, this.expiresAt, this.channel, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default nudge exception in status created. */
export function newDefaultNudgeException(code: string, label: string): DefaultNudgeException {
  return new DefaultNudgeException(code, label, 0, "", 0, "created");
}
