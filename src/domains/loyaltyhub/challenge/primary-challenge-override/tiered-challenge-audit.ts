import * as text from "../../../../kit/text.js";

/** Where a tiered challenge audit is in its life cycle. */
export type TieredChallengeAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered challenge audit as the challenge team keeps it. */
export class TieredChallengeAudit {
  code: string;
  label: string;
  ceiling: number;
  locale: string;
  clicks: number;
  visible: boolean;
  weight: number;
  expiresAt: number;
  channel: string;
  endsAt: number;
  description: string;
  status: TieredChallengeAuditStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    locale: string,
    clicks: number,
    visible: boolean,
    weight: number,
    expiresAt: number,
    channel: string,
    endsAt: number,
    description: string,
    status: TieredChallengeAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.locale = locale;
    this.clicks = clicks;
    this.visible = visible;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.channel = channel;
    this.endsAt = endsAt;
    this.description = description;
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

  canMoveTo(next: TieredChallengeAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredChallengeAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered challenge audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.endsAt + this.ceiling) * 100) / 100;
  }

  copy(): TieredChallengeAudit {
    return new TieredChallengeAudit(
      this.code,
      this.label,
      this.ceiling,
      this.locale,
      this.clicks,
      this.visible,
      this.weight,
      this.expiresAt,
      this.channel,
      this.endsAt,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered challenge audit in status planned. */
export function newTieredChallengeAudit(code: string, label: string): TieredChallengeAudit {
  return new TieredChallengeAudit(code, label, 0, "", 0, false, 0, 0, "", 0, "", "planned");
}
