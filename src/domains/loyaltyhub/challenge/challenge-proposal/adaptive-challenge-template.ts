import * as text from "../../../../kit/text.js";

/** Where a adaptive challenge template is in its life cycle. */
export type AdaptiveChallengeTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** One adaptive challenge template, with what the planners need to act on it. */
export class AdaptiveChallengeTemplate {
  code: string;
  label: string;
  currency: string;
  priority: number;
  ceiling: number;
  maximum: number;
  active: boolean;
  channel: string;
  status: AdaptiveChallengeTemplateStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    priority: number,
    ceiling: number,
    maximum: number,
    active: boolean,
    channel: string,
    status: AdaptiveChallengeTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.priority = priority;
    this.ceiling = ceiling;
    this.maximum = maximum;
    this.active = active;
    this.channel = channel;
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

  canMoveTo(next: AdaptiveChallengeTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
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

  moveTo(next: AdaptiveChallengeTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive challenge template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive challenge template"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.priority * this.maximum * 100) / 100;
  }

  copy(): AdaptiveChallengeTemplate {
    return new AdaptiveChallengeTemplate(
      this.code,
      this.label,
      this.currency,
      this.priority,
      this.ceiling,
      this.maximum,
      this.active,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive challenge template in status requested. */
export function newAdaptiveChallengeTemplate(code: string, label: string): AdaptiveChallengeTemplate {
  return new AdaptiveChallengeTemplate(code, label, "", 0, 0, 0, false, "", "requested");
}
