import * as text from "../../../../kit/text.js";

/** Where a preference override is in its life cycle. */
export type PreferenceOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One preference override, with what the planners need to act on it. */
export class PreferenceOverride {
  code: string;
  label: string;
  archived: boolean;
  summary: string;
  sendAt: number;
  reviewer: string;
  status: PreferenceOverrideStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    summary: string,
    sendAt: number,
    reviewer: string,
    status: PreferenceOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.summary = summary;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
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

  canMoveTo(next: PreferenceOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
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

  moveTo(next: PreferenceOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): PreferenceOverride {
    return new PreferenceOverride(
      this.code,
      this.label,
      this.archived,
      this.summary,
      this.sendAt,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a preference override in status open. */
export function newPreferenceOverride(code: string, label: string): PreferenceOverride {
  return new PreferenceOverride(code, label, false, "", 0, "", "open");
}
