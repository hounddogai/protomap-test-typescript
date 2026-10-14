import * as text from "../../../../kit/text.js";

/** Where a csat claim is in its life cycle. */
export type CsatClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A csat claim. Its code is unique within a tenant. */
export class CsatClaim {
  code: string;
  title: string;
  threshold: number;
  expiresAt: number;
  discount: number;
  openRate: number;
  quantity: number;
  status: CsatClaimStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    expiresAt: number,
    discount: number,
    openRate: number,
    quantity: number,
    status: CsatClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.openRate = openRate;
    this.quantity = quantity;
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

  canMoveTo(next: CsatClaimStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"csat claim"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.expiresAt * this.quantity * 100) / 100;
  }

  copy(): CsatClaim {
    return new CsatClaim(
      this.code,
      this.title,
      this.threshold,
      this.expiresAt,
      this.discount,
      this.openRate,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a csat claim in status new. */
export function newCsatClaim(code: string, title: string): CsatClaim {
  return new CsatClaim(code, title, 0, 0, 0, 0, 0, "new");
}
