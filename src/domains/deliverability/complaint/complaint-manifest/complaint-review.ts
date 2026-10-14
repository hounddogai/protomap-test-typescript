import * as text from "../../../../kit/text.js";

/** Where a complaint review is in its life cycle. */
export type ComplaintReviewStatus = "created" | "validated" | "published" | "retired";

/** The record of a complaint review and its current status. */
export class ComplaintReview {
  code: string;
  label: string;
  name: string;
  version: number;
  title: string;
  clicks: number;
  sendAt: number;
  attributes: Map<string, string>;
  revision: number;
  status: ComplaintReviewStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    version: number,
    title: string,
    clicks: number,
    sendAt: number,
    attributes: Map<string, string>,
    revision: number,
    status: ComplaintReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.version = version;
    this.title = title;
    this.clicks = clicks;
    this.sendAt = sendAt;
    this.attributes = attributes;
    this.revision = revision;
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

  canMoveTo(next: ComplaintReviewStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ComplaintReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round(this.revision * this.clicks * 100) / 100;
  }

  copy(): ComplaintReview {
    return new ComplaintReview(
      this.code,
      this.label,
      this.name,
      this.version,
      this.title,
      this.clicks,
      this.sendAt,
      this.attributes,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a complaint review in status created. */
export function newComplaintReview(code: string, label: string): ComplaintReview {
  return new ComplaintReview(code, label, "", 0, "", 0, 0, new Map<string, string>(), 0, "created");
}
