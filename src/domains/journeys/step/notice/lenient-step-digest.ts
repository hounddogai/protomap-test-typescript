import * as text from "../../../../kit/text.js";

/** Where a lenient step digest is in its life cycle. */
export type LenientStepDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a lenient step digest and its current status. */
export class LenientStepDigest {
  code: string;
  title: string;
  frequencyCap: number;
  windowDays: number;
  journeyId: string;
  visible: boolean;
  label: string;
  status: LenientStepDigestStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    windowDays: number,
    journeyId: string,
    visible: boolean,
    label: string,
    status: LenientStepDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.windowDays = windowDays;
    this.journeyId = journeyId;
    this.visible = visible;
    this.label = label;
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

  canMoveTo(next: LenientStepDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientStepDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient step digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient step digest"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.frequencyCap + this.windowDays) * 100) / 100;
  }

  copy(): LenientStepDigest {
    return new LenientStepDigest(
      this.code,
      this.title,
      this.frequencyCap,
      this.windowDays,
      this.journeyId,
      this.visible,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient step digest in status requested. */
export function newLenientStepDigest(code: string, title: string): LenientStepDigest {
  return new LenientStepDigest(code, title, 0, 0, "", false, "", "requested");
}
