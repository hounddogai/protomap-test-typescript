import * as text from "../../../../kit/text.js";

/** Where a global exit rule digest is in its life cycle. */
export type GlobalExitRuleDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A global exit rule digest as the exit rule team keeps it. */
export class GlobalExitRuleDigest {
  code: string;
  label: string;
  locale: string;
  visible: boolean;
  durationMinutes: number;
  name: string;
  graceDays: number;
  active: boolean;
  status: GlobalExitRuleDigestStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    visible: boolean,
    durationMinutes: number,
    name: string,
    graceDays: number,
    active: boolean,
    status: GlobalExitRuleDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.visible = visible;
    this.durationMinutes = durationMinutes;
    this.name = name;
    this.graceDays = graceDays;
    this.active = active;
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

  canMoveTo(next: GlobalExitRuleDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalExitRuleDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global exit rule digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.durationMinutes - this.graceDays) * 100) / 100;
  }

  copy(): GlobalExitRuleDigest {
    return new GlobalExitRuleDigest(
      this.code,
      this.label,
      this.locale,
      this.visible,
      this.durationMinutes,
      this.name,
      this.graceDays,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global exit rule digest in status requested. */
export function newGlobalExitRuleDigest(code: string, label: string): GlobalExitRuleDigest {
  return new GlobalExitRuleDigest(code, label, "", false, 0, "", 0, false, "requested");
}
