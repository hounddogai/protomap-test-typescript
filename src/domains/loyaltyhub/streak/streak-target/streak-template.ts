import * as text from "../../../../kit/text.js";

/** Where a streak template is in its life cycle. */
export type StreakTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** A streak template. Its code is unique within a tenant. */
export class StreakTemplate {
  code: string;
  label: string;
  createdAt: number;
  clicks: number;
  archived: boolean;
  region: string;
  status: StreakTemplateStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    clicks: number,
    archived: boolean,
    region: string,
    status: StreakTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.clicks = clicks;
    this.archived = archived;
    this.region = region;
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

  canMoveTo(next: StreakTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StreakTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.clicks + this.createdAt) * 100) / 100;
  }

  copy(): StreakTemplate {
    return new StreakTemplate(
      this.code,
      this.label,
      this.createdAt,
      this.clicks,
      this.archived,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a streak template in status requested. */
export function newStreakTemplate(code: string, label: string): StreakTemplate {
  return new StreakTemplate(code, label, 0, 0, false, "", "requested");
}
