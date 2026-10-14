/**
 * The manual sla digest records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual sla digest is in its life cycle. */
export type ManualSlaDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One manual sla digest, with what the planners need to act on it. */
export class ManualSlaDigest {
  code: string;
  title: string;
  notes: string;
  reviewer: string;
  utmSource: string;
  description: string;
  quantity: number;
  status: ManualSlaDigestStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    reviewer: string,
    utmSource: string,
    description: string,
    quantity: number,
    status: ManualSlaDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.description = description;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualSlaDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualSlaDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual sla digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ManualSlaDigest {
    return new ManualSlaDigest(
      this.code,
      this.title,
      this.notes,
      this.reviewer,
      this.utmSource,
      this.description,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a manual sla digest in status open. */
export function newManualSlaDigest(code: string, title: string): ManualSlaDigest {
  return new ManualSlaDigest(code, title, "", "", "", "", 0, "open");
}
