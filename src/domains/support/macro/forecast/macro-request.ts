import * as text from "../../../../kit/text.js";

/** Where a macro request is in its life cycle. */
export type MacroRequestStatus = "created" | "validated" | "published" | "retired";

/** A macro request as the macro team keeps it. */
export class MacroRequest {
  code: string;
  title: string;
  expiresAt: number;
  campaignRef: string;
  clicks: number;
  label: string;
  status: MacroRequestStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    campaignRef: string,
    clicks: number,
    label: string,
    status: MacroRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.clicks = clicks;
    this.label = label;
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

  canMoveTo(next: MacroRequestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: MacroRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.expiresAt - this.clicks) * 100) / 100;
  }

  copy(): MacroRequest {
    return new MacroRequest(
      this.code,
      this.title,
      this.expiresAt,
      this.campaignRef,
      this.clicks,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a macro request in status created. */
export function newMacroRequest(code: string, title: string): MacroRequest {
  return new MacroRequest(code, title, 0, "", 0, "", "created");
}
