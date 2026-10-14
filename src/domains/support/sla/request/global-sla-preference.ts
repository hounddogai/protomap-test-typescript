import * as text from "../../../../kit/text.js";

/** Where a global sla preference is in its life cycle. */
export type GlobalSlaPreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One global sla preference, with what the planners need to act on it. */
export class GlobalSlaPreference {
  code: string;
  label: string;
  locale: string;
  variant: string;
  createdAt: number;
  checksum: string;
  reviewer: string;
  status: GlobalSlaPreferenceStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    variant: string,
    createdAt: number,
    checksum: string,
    reviewer: string,
    status: GlobalSlaPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.variant = variant;
    this.createdAt = createdAt;
    this.checksum = checksum;
    this.reviewer = reviewer;
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

  canMoveTo(next: GlobalSlaPreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalSlaPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global sla preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): GlobalSlaPreference {
    return new GlobalSlaPreference(
      this.code,
      this.label,
      this.locale,
      this.variant,
      this.createdAt,
      this.checksum,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global sla preference in status draft. */
export function newGlobalSlaPreference(code: string, label: string): GlobalSlaPreference {
  return new GlobalSlaPreference(code, label, "", "", 0, "", "", "draft");
}
