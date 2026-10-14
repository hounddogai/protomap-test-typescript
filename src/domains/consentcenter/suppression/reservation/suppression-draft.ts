import * as text from "../../../../kit/text.js";

/** Where a suppression draft is in its life cycle. */
export type SuppressionDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** A suppression draft as the suppression team keeps it. */
export class SuppressionDraft {
  code: string;
  title: string;
  externalRef: string;
  conversionRate: number;
  pinned: boolean;
  status: SuppressionDraftStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    conversionRate: number,
    pinned: boolean,
    status: SuppressionDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"suppression draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): SuppressionDraft {
    return new SuppressionDraft(this.code, this.title, this.externalRef, this.conversionRate, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a suppression draft in status requested. */
export function newSuppressionDraft(code: string, title: string): SuppressionDraft {
  return new SuppressionDraft(code, title, "", 0, false, "requested");
}
