/**
 * The manual model draft records of attribution's model work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual model draft is in its life cycle. */
export type ManualModelDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a manual model draft and its current status. */
export class ManualModelDraft {
  code: string;
  label: string;
  ceiling: number;
  sendAt: number;
  windowDays: number;
  version: number;
  status: ManualModelDraftStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    sendAt: number,
    windowDays: number,
    version: number,
    status: ManualModelDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualModelDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualModelDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual model draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"manual model draft"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.windowDays - this.sendAt) * 100) / 100;
  }

  copy(): ManualModelDraft {
    return new ManualModelDraft(
      this.code,
      this.label,
      this.ceiling,
      this.sendAt,
      this.windowDays,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual model draft in status proposed. */
export function newManualModelDraft(code: string, label: string): ManualModelDraft {
  return new ManualModelDraft(code, label, 0, 0, 0, 0, "proposed");
}
