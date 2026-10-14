import * as text from "../../../../kit/text.js";

/** Where a touchpoint agreement is in its life cycle. */
export type TouchpointAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A touchpoint agreement as the touchpoint team keeps it. */
export class TouchpointAgreement {
  code: string;
  label: string;
  summary: string;
  checksum: string;
  pinned: boolean;
  score: number;
  status: TouchpointAgreementStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    checksum: string,
    pinned: boolean,
    score: number,
    status: TouchpointAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.checksum = checksum;
    this.pinned = pinned;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"touchpoint agreement"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): TouchpointAgreement {
    return new TouchpointAgreement(
      this.code,
      this.label,
      this.summary,
      this.checksum,
      this.pinned,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a touchpoint agreement in status planned. */
export function newTouchpointAgreement(code: string, label: string): TouchpointAgreement {
  return new TouchpointAgreement(code, label, "", "", false, 0, "planned");
}
