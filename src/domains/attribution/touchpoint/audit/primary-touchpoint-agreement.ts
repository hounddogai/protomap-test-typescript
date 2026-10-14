import * as text from "../../../../kit/text.js";

/** Where a primary touchpoint agreement is in its life cycle. */
export type PrimaryTouchpointAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A primary touchpoint agreement as the touchpoint team keeps it. */
export class PrimaryTouchpointAgreement {
  code: string;
  label: string;
  pinned: boolean;
  utmSource: string;
  quantity: number;
  version: number;
  status: PrimaryTouchpointAgreementStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    utmSource: string,
    quantity: number,
    version: number,
    status: PrimaryTouchpointAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.utmSource = utmSource;
    this.quantity = quantity;
    this.version = version;
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

  canMoveTo(next: PrimaryTouchpointAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryTouchpointAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary touchpoint agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"primary touchpoint agreement"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.version * this.quantity * 100) / 100;
  }

  copy(): PrimaryTouchpointAgreement {
    return new PrimaryTouchpointAgreement(
      this.code,
      this.label,
      this.pinned,
      this.utmSource,
      this.quantity,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary touchpoint agreement in status new. */
export function newPrimaryTouchpointAgreement(code: string, label: string): PrimaryTouchpointAgreement {
  return new PrimaryTouchpointAgreement(code, label, false, "", 0, 0, "new");
}
