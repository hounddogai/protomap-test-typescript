import * as text from "../../../../kit/text.js";

/** Where a adaptive preference policy is in its life cycle. */
export type AdaptivePreferencePolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive preference policy as the preference team keeps it. */
export class AdaptivePreferencePolicy {
  code: string;
  title: string;
  expiresAt: number;
  budget: number;
  label: string;
  checksum: string;
  status: AdaptivePreferencePolicyStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    budget: number,
    label: string,
    checksum: string,
    status: AdaptivePreferencePolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.label = label;
    this.checksum = checksum;
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

  canMoveTo(next: AdaptivePreferencePolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: AdaptivePreferencePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive preference policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round((this.budget + this.expiresAt) * 100) / 100;
  }

  copy(): AdaptivePreferencePolicy {
    return new AdaptivePreferencePolicy(
      this.code,
      this.title,
      this.expiresAt,
      this.budget,
      this.label,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive preference policy in status requested. */
export function newAdaptivePreferencePolicy(code: string, title: string): AdaptivePreferencePolicy {
  return new AdaptivePreferencePolicy(code, title, 0, 0, "", "", "requested");
}
