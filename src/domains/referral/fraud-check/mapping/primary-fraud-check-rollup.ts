import * as text from "../../../../kit/text.js";

/** Where a primary fraud check rollup is in its life cycle. */
export type PrimaryFraudCheckRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary fraud check rollup as the fraud check team keeps it. */
export class PrimaryFraudCheckRollup {
  code: string;
  label: string;
  locale: string;
  campaignRef: string;
  description: string;
  visible: boolean;
  ratio: number;
  version: number;
  summary: string;
  status: PrimaryFraudCheckRollupStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    campaignRef: string,
    description: string,
    visible: boolean,
    ratio: number,
    version: number,
    summary: string,
    status: PrimaryFraudCheckRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.description = description;
    this.visible = visible;
    this.ratio = ratio;
    this.version = version;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryFraudCheckRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryFraudCheckRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary fraud check rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.version + this.ratio) * 100) / 100;
  }

  copy(): PrimaryFraudCheckRollup {
    return new PrimaryFraudCheckRollup(
      this.code,
      this.label,
      this.locale,
      this.campaignRef,
      this.description,
      this.visible,
      this.ratio,
      this.version,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary fraud check rollup in status draft. */
export function newPrimaryFraudCheckRollup(code: string, label: string): PrimaryFraudCheckRollup {
  return new PrimaryFraudCheckRollup(code, label, "", "", "", false, 0, 0, "", "draft");
}
