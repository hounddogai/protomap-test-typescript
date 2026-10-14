import * as text from "../../../../kit/text.js";

/** Where a strict macro request is in its life cycle. */
export type StrictMacroRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict macro request, with what the planners need to act on it. */
export class StrictMacroRequest {
  code: string;
  title: string;
  audienceId: string;
  pinned: boolean;
  timezone: string;
  country: string;
  label: string;
  margin: number;
  status: StrictMacroRequestStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    pinned: boolean,
    timezone: string,
    country: string,
    label: string,
    margin: number,
    status: StrictMacroRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.pinned = pinned;
    this.timezone = timezone;
    this.country = country;
    this.label = label;
    this.margin = margin;
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

  canMoveTo(next: StrictMacroRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
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

  moveTo(next: StrictMacroRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict macro request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): StrictMacroRequest {
    return new StrictMacroRequest(
      this.code,
      this.title,
      this.audienceId,
      this.pinned,
      this.timezone,
      this.country,
      this.label,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a strict macro request in status open. */
export function newStrictMacroRequest(code: string, title: string): StrictMacroRequest {
  return new StrictMacroRequest(code, title, "", false, "", "", "", 0, "open");
}
