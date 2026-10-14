import * as text from "../../../../kit/text.js";

/** Where a activation bundle is in its life cycle. */
export type ActivationBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** One activation bundle, with what the planners need to act on it. */
export class ActivationBundle {
  code: string;
  label: string;
  threshold: number;
  locale: string;
  sequence: number;
  durationMinutes: number;
  variant: string;
  status: ActivationBundleStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    locale: string,
    sequence: number,
    durationMinutes: number,
    variant: string,
    status: ActivationBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.locale = locale;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
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

  canMoveTo(next: ActivationBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ActivationBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"activation bundle"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.sequence * this.durationMinutes * 100) / 100;
  }

  copy(): ActivationBundle {
    return new ActivationBundle(
      this.code,
      this.label,
      this.threshold,
      this.locale,
      this.sequence,
      this.durationMinutes,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a activation bundle in status requested. */
export function newActivationBundle(code: string, label: string): ActivationBundle {
  return new ActivationBundle(code, label, 0, "", 0, 0, "", "requested");
}
