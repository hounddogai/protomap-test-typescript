import * as text from "../../../../kit/text.js";

/** Where a global post request is in its life cycle. */
export type GlobalPostRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global post request and its current status. */
export class GlobalPostRequest {
  code: string;
  label: string;
  timezone: string;
  notes: string;
  updatedAt: number;
  attributes: Map<string, string>;
  category: string;
  active: boolean;
  status: GlobalPostRequestStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    notes: string,
    updatedAt: number,
    attributes: Map<string, string>,
    category: string,
    active: boolean,
    status: GlobalPostRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.category = category;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalPostRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalPostRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global post request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global post request"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): GlobalPostRequest {
    return new GlobalPostRequest(
      this.code,
      this.label,
      this.timezone,
      this.notes,
      this.updatedAt,
      this.attributes,
      this.category,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global post request in status draft. */
export function newGlobalPostRequest(code: string, label: string): GlobalPostRequest {
  return new GlobalPostRequest(code, label, "", "", 0, new Map<string, string>(), "", false, "draft");
}
