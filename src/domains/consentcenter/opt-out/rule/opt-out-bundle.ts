import * as text from "../../../../kit/text.js";

/** Where a opt out bundle is in its life cycle. */
export type OptOutBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** One opt out bundle, with what the planners need to act on it. */
export class OptOutBundle {
  code: string;
  label: string;
  channel: string;
  expiresAt: number;
  title: string;
  externalRef: string;
  cohort: string;
  quantity: number;
  score: number;
  status: OptOutBundleStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    expiresAt: number,
    title: string,
    externalRef: string,
    cohort: string,
    quantity: number,
    score: number,
    status: OptOutBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.title = title;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.quantity = quantity;
    this.score = score;
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

  canMoveTo(next: OptOutBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: OptOutBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.score - this.quantity) * 100) / 100;
  }

  copy(): OptOutBundle {
    return new OptOutBundle(
      this.code,
      this.label,
      this.channel,
      this.expiresAt,
      this.title,
      this.externalRef,
      this.cohort,
      this.quantity,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a opt out bundle in status requested. */
export function newOptOutBundle(code: string, label: string): OptOutBundle {
  return new OptOutBundle(code, label, "", 0, "", "", "", 0, 0, "requested");
}
