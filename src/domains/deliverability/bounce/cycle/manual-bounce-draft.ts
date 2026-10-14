import * as text from "../../../../kit/text.js";

/** Where a manual bounce draft is in its life cycle. */
export type ManualBounceDraftStatus = "created" | "validated" | "published" | "retired";

/** The record of a manual bounce draft and its current status. */
export class ManualBounceDraft {
  code: string;
  title: string;
  reviewer: string;
  utmSource: string;
  checksum: string;
  ownerId: string;
  ceiling: number;
  source: string;
  description: string;
  status: ManualBounceDraftStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    utmSource: string,
    checksum: string,
    ownerId: string,
    ceiling: number,
    source: string,
    description: string,
    status: ManualBounceDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.checksum = checksum;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.source = source;
    this.description = description;
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

  canMoveTo(next: ManualBounceDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualBounceDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bounce draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual bounce draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): ManualBounceDraft {
    return new ManualBounceDraft(
      this.code,
      this.title,
      this.reviewer,
      this.utmSource,
      this.checksum,
      this.ownerId,
      this.ceiling,
      this.source,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a manual bounce draft in status created. */
export function newManualBounceDraft(code: string, title: string): ManualBounceDraft {
  return new ManualBounceDraft(code, title, "", "", "", "", 0, "", "", "created");
}
