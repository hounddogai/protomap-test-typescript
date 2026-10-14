import * as text from "../../../../kit/text.js";

/** Where a csat template is in its life cycle. */
export type CsatTemplateStatus = "created" | "validated" | "published" | "retired";

/** One csat template, with what the planners need to act on it. */
export class CsatTemplate {
  code: string;
  label: string;
  currency: string;
  impressions: number;
  visible: boolean;
  windowDays: number;
  rate: number;
  retries: number;
  status: CsatTemplateStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    impressions: number,
    visible: boolean,
    windowDays: number,
    rate: number,
    retries: number,
    status: CsatTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.impressions = impressions;
    this.visible = visible;
    this.windowDays = windowDays;
    this.rate = rate;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"csat template"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.impressions + this.windowDays) * 100) / 100;
  }

  copy(): CsatTemplate {
    return new CsatTemplate(
      this.code,
      this.label,
      this.currency,
      this.impressions,
      this.visible,
      this.windowDays,
      this.rate,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a csat template in status created. */
export function newCsatTemplate(code: string, label: string): CsatTemplate {
  return new CsatTemplate(code, label, "", 0, false, 0, 0, 0, "created");
}
