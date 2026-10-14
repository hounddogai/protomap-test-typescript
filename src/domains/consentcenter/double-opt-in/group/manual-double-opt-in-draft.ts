import * as text from "../../../../kit/text.js";

/** Where a manual double opt in draft is in its life cycle. */
export type ManualDoubleOptInDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual double opt in draft. Its code is unique within a tenant. */
export class ManualDoubleOptInDraft {
  code: string;
  title: string;
  currency: string;
  updatedAt: number;
  description: string;
  visible: boolean;
  status: ManualDoubleOptInDraftStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    updatedAt: number,
    description: string,
    visible: boolean,
    status: ManualDoubleOptInDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.updatedAt = updatedAt;
    this.description = description;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualDoubleOptInDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualDoubleOptInDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual double opt in draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual double opt in draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): ManualDoubleOptInDraft {
    return new ManualDoubleOptInDraft(
      this.code,
      this.title,
      this.currency,
      this.updatedAt,
      this.description,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual double opt in draft in status idle. */
export function newManualDoubleOptInDraft(code: string, title: string): ManualDoubleOptInDraft {
  return new ManualDoubleOptInDraft(code, title, "", 0, "", false, "idle");
}
