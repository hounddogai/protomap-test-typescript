/**
 * The csat request records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat request is in its life cycle. */
export type CsatRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A csat request as the csat team keeps it. */
export class CsatRequest {
  code: string;
  label: string;
  priority: number;
  threshold: number;
  contactEmail: string;
  summary: string;
  retries: number;
  ownerId: string;
  windowDays: number;
  attributes: Map<string, string>;
  archived: boolean;
  status: CsatRequestStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    threshold: number,
    contactEmail: string,
    summary: string,
    retries: number,
    ownerId: string,
    windowDays: number,
    attributes: Map<string, string>,
    archived: boolean,
    status: CsatRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.threshold = threshold;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.retries = retries;
    this.ownerId = ownerId;
    this.windowDays = windowDays;
    this.attributes = attributes;
    this.archived = archived;
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

  canMoveTo(next: CsatRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round((this.threshold - this.priority) * 100) / 100;
  }

  copy(): CsatRequest {
    return new CsatRequest(
      this.code,
      this.label,
      this.priority,
      this.threshold,
      this.contactEmail,
      this.summary,
      this.retries,
      this.ownerId,
      this.windowDays,
      this.attributes,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a csat request in status open. */
export function newCsatRequest(code: string, label: string): CsatRequest {
  return new CsatRequest(code, label, 0, 0, "", "", 0, "", 0, new Map<string, string>(), false, "open");
}
