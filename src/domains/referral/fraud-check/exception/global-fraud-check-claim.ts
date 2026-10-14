import * as text from "../../../../kit/text.js";

/** Where a global fraud check claim is in its life cycle. */
export type GlobalFraudCheckClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global fraud check claim. Its code is unique within a tenant. */
export class GlobalFraudCheckClaim {
  code: string;
  title: string;
  locale: string;
  notes: string;
  externalRef: string;
  visible: boolean;
  score: number;
  status: GlobalFraudCheckClaimStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    notes: string,
    externalRef: string,
    visible: boolean,
    score: number,
    status: GlobalFraudCheckClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.notes = notes;
    this.externalRef = externalRef;
    this.visible = visible;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalFraudCheckClaimStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalFraudCheckClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global fraud check claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): GlobalFraudCheckClaim {
    return new GlobalFraudCheckClaim(
      this.code,
      this.title,
      this.locale,
      this.notes,
      this.externalRef,
      this.visible,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global fraud check claim in status new. */
export function newGlobalFraudCheckClaim(code: string, title: string): GlobalFraudCheckClaim {
  return new GlobalFraudCheckClaim(code, title, "", "", "", false, 0, "new");
}
