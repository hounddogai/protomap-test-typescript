import * as text from "../../../../kit/text.js";

/** Where a adaptive csat template is in its life cycle. */
export type AdaptiveCsatTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a adaptive csat template and its current status. */
export class AdaptiveCsatTemplate {
  code: string;
  title: string;
  priority: number;
  active: boolean;
  sequence: number;
  startsAt: number;
  impressions: number;
  externalRef: string;
  archived: boolean;
  status: AdaptiveCsatTemplateStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    active: boolean,
    sequence: number,
    startsAt: number,
    impressions: number,
    externalRef: string,
    archived: boolean,
    status: AdaptiveCsatTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.active = active;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.externalRef = externalRef;
    this.archived = archived;
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

  canMoveTo(next: AdaptiveCsatTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveCsatTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive csat template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.priority - this.impressions) * 100) / 100;
  }

  copy(): AdaptiveCsatTemplate {
    return new AdaptiveCsatTemplate(
      this.code,
      this.title,
      this.priority,
      this.active,
      this.sequence,
      this.startsAt,
      this.impressions,
      this.externalRef,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive csat template in status requested. */
export function newAdaptiveCsatTemplate(code: string, title: string): AdaptiveCsatTemplate {
  return new AdaptiveCsatTemplate(code, title, 0, false, 0, 0, 0, "", false, "requested");
}
